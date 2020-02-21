const express = require('express');
const app = express();
const createError = require('http-errors');
const serveIndex = require('serve-index');
const path = require('path')
const JSONData = require("./jsondata.js")
const session = require('express-session');
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo')(session);
let cors = require('cors') // ONLY FOR DEVELOPMENT!!!
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongooseConnection  =  require("./mongooseclient.js")()
app.mongooseConnection = mongooseConnection // For mocha test to close
const SECRET_KEY    = process.env.SECRET_KEY
const PREFIX        = process.env.VUE_APP_PREFIX ? path.posix.join("/",process.env.VUE_APP_PREFIX) : "/"
const PREFIX_LOGIN  = path.posix.join("/",PREFIX, "login")
const PREFIX_LOGOUT = path.posix.join("/",PREFIX, "logout")
const PREFIX_STATUS = path.posix.join("/",PREFIX, "status")
const PREFIX_SCHEMA = path.posix.join("/",PREFIX, "schema")
const PREFIX_CREATE = path.posix.join("/",PREFIX, "create")
const PREFIX_READ   = path.posix.join("/",PREFIX, "read")
const PREFIX_UPDATE = path.posix.join("/",PREFIX, "update")
const PREFIX_DELETE = path.posix.join("/",PREFIX, "delete")
const PREFIX_SIOCLIENTS_CREATE   = path.posix.join("/",PREFIX, "sioclients", "create")
const PREFIX_SIOCLIENTS_READ   = path.posix.join("/",PREFIX, "sioclients", "read")
const PREFIX_SIOCLIENTS_UPDATE   = path.posix.join("/",PREFIX, "sioclients", "update")
const PREFIX_SIOCLIENTS_DELETE   = path.posix.join("/",PREFIX, "sioclients", "delete")

// 
mongoose.set('useCreateIndex', true);
const DATABASE_URL      = process.env.DATABASE_URL
const DATABASE_USERNAME = process.env.DATABASE_USERNAME
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD
let options ={
  useUnifiedTopology: true,
  useNewUrlParser: true,
  user: DATABASE_USERNAME,
  pass: DATABASE_PASSWORD,                  
  auth:{
      authSource: 'admin'                    
  }
}

// LOGGING
var log = require("ucipass-logger")("sio-app")
log.transports.console.level = 'debug'
// log.transports.file.level = 'error'
// const config = require('config');

let sio = null;
const events = require("./events.js")
events.on("onSocketIoStarted", (sioInstance)=>{
  sio = sioInstance;
})

app.use(cors({origin:true,credentials: true}));; //PLEASE REMOVE FOR PRODUCTION
app.use(session({
  store: new MongoStore({
      // clientPromise: clientInstancePromise
      mongooseConnection: mongooseConnection
      // url: DATABASE_URL.href
  }),
  secret: SECRET_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 * 1 // one week
    //maxAge: 1000 * 5  // 5 seconds
  }
}));

// app.use(session({
//   secret: process.env.SECdb = await (require("../mongooseclient.js"))()  RET_KEY,
//   resave: false,
//   saveUninitialized: false
// }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(function(username, password, done) {  // THIS MUST come from POST on body.username and body.passport

  // const WebuserSchema = new mongoose.Schema({
  //   username: { type: String, required: true, unique: true },
  //   password: { type: String, required: true },
  //   expiration: { type: Date, required: true, default: Date.now },
  // });
  // const Webuser = mongooseConnection.model( "Webuser", WebuserSchema)

  mongooseConnection.getWebuser(username)
  .then((user)=>{
    if( username == user.username  && password == user.password){
      return done(null, {id:username});	// PASSPORT puts this in the user object for serialization
    }
    else{
      return done(null, false);
    }    
  })
  .catch((err)=>{
    return done(null, false);
  })


}))

passport.serializeUser(function(user, done) {
	return done(null, user.id); // THIS IS WHERE THE user id is supposed to be put in an external session db)
})

passport.deserializeUser(function(id, done) {
	return done(null, {id:id});    // THIS IS WHERE THE user id is supposed to be checked against an external session db)
})

passport.checkLogin = function(req, res, next) {
	if (req.isAuthenticated()){
		return next();
		}
	log.error("AUTH - NOT LOGGED IN IP:",req.clientIp);
	res.json(false);
	//res.redirect(PREFIX_LOGIN)
	}


//=================================================
//=================================================
//  HTML GETS & POSTS
//=================================================
//=================================================

app.use( PREFIX ,express.static('manager/dist'))
app.use( "/clients" ,express.static('clients'), serveIndex('clients', {'icons': true}))
log.info("Listening path:", PREFIX)

app.get('/', (req, res) => {
    res.send('Socket Manager')
})

app.get('/favicon.ico', (req, res) => res.status(204));

app.post(PREFIX_LOGIN, function (req,res,next) {
  passport.authenticate('local', function(err, user, info) {				// LOGIN SEND post data to LocalStrategy body.username body.passport to CHECK11
		log.debug("authenticate: Username",user,"IP:",req.clientIp);										// LocalStrategy returns user object
    
    if (err) { 
      log.error("authenticate ERROR:","IP:",req.clientIp);
      return next(err); 
    }                    //If error return next with error
    
    if (!user) {
      log.error("Authentication failed","IP:",req.clientIp);
      return res.json(false);
    }  //If user is not there redirect it to login page
    
    req.logIn(user, function(err) {                                     //Request the actual Login from passport user object will be par or 'req'
			if (err) { 
        log.error("authentication internal error: User:",user,"IP:",req.clientIp)
        return next(err); //If error return next with error
      }

			// LOGING IS COMPLETE!!!!
			log.info("Passport  auth success user:",user.id,"IP:",req.clientIp)
      // return res.json("success");
      return res.status(err ? 500 : 200).send(err ? err : user);
      // return res.redirect('')
		});
	})(req, res, next);	
})

app.post(PREFIX_LOGOUT, function (req,res,next) {
	log.info("LOGOUT:", ( req.user !== undefined ? req.user: 'Anonnymous'));
	req.logOut();										// logout
	req.session.destroy(function(){						// delete the auth session 
    res.json("success");
  });								
 
})

app.get(PREFIX_LOGIN, passport.checkLogin, (req,res) => {
  res.json("success");
})

app.post(PREFIX_SCHEMA, passport.checkLogin ,(req, res) => {
  let schema =  
  {
      name: "",
      rcvName: "",
      rcvPort: "",
      fwdName: "",
      fwdHost: "",
      fwdPort: ""
  }
  res.json(schema)
})

app.post(PREFIX_STATUS, passport.checkLogin , async (req, res) => {
  let reply = await sio.status()
  res.json(reply)
})

app.get(PREFIX_STATUS, passport.checkLogin , async (req, res) => {
  let reply = await sio.status()
  res.json(reply)
})

app.post(PREFIX_CREATE, passport.checkLogin, async (req, res) => {
  let room = req.body
  await mongooseConnection.createRoom(room).catch(()=>{})
  await sio.refresh()
  res.json("success");
})

app.post(PREFIX_READ, passport.checkLogin, async (req, res) => {
  let roomArray = await mongooseConnection.getRooms().catch(()=> [])
  res.json(roomArray)
})

app.post(PREFIX_UPDATE, passport.checkLogin, async (req, res) => {
  let room = req.body
  await mongooseConnection.updateRoom(room).catch(()=>{})
  await sio.refresh()
  return res.json("success");
})

app.post(PREFIX_DELETE, passport.checkLogin, async (req, res) => {
  try {
    let room = req.body
    await mongooseConnection.deleteRoom(room).catch(()=>{})
    await sio.refresh()
    res.json("success");    
  } catch (error) {
    res.json(`Error: ${PREFIX_DELETE}`);         
  }

})

app.post(PREFIX_SIOCLIENTS_CREATE, passport.checkLogin, async (req, res) => {
  let client = req.body
  mongooseConnection.createClient(client)
  .then((response)=> res.json("success"))  
  .catch((error)=> res.json(error))  
  
})

app.post(PREFIX_SIOCLIENTS_READ, passport.checkLogin, async (req, res) => {
  let Clients = await mongooseConnection.getClients().catch(()=>{[]})  
  res.json(Clients)
})

app.post(PREFIX_SIOCLIENTS_UPDATE, passport.checkLogin, async (req, res) => {
  let Clients = await mongooseConnection.updateClient(client).catch(()=>{[]})  
  res.json(Clients)
})

app.post(PREFIX_SIOCLIENTS_DELETE, passport.checkLogin, async (req, res) => {

  let client = req.body
  mongooseConnection.deleteClient(client)
  .then((response)=> res.json("success"))  
  .catch((error)=> res.json("failure"))  

})

// catch 404 and forward to error handler
app.use((req, res, next) => {
  log.error("INVALID URL:",req.url)
  next(createError(404));
});

// error handler
app.use((err, req, res) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;
