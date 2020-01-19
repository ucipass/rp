const express = require('express');
const app = express();
const serveIndex = require('serve-index');
const path = require('path')
const JSONData = require("./jsondata.js")
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
let cors = require('cors') // ONLY FOR DEVELOPMENT!!!

// ENVIRONMENT
const clientInstancePromise = require('./mongoclient.js')
const SECRET_KEY    = process.env.SECRET_KEY
const PREFIX        = process.env.VUE_APP_PREFIX ? path.posix.join("/",process.env.VUE_APP_PREFIX) : "/"
const PREFIX_SCHEMA = path.posix.join("/",PREFIX, "schema")
const PREFIX_CREATE = path.posix.join("/",PREFIX, "create")
const PREFIX_READ   = path.posix.join("/",PREFIX, "read")
const PREFIX_UPDATE = path.posix.join("/",PREFIX, "update")
const PREFIX_DELETE = path.posix.join("/",PREFIX, "delete")

// LOGGING
var log = require("ucipass-logger")("sio-app")
log.transports.console.level = 'info'
// log.transports.file.level = 'error'
// const config = require('config');

let sio = null;

const createError = require('http-errors');
const events = require("./events.js")
events.on("onSocketIoStarted", (sioInstance)=>{
  sio = sioInstance;
})

let schema =  
  {
      name: "",
      rcvName: "",
      rcvPort: "",
      fwdName: "",
      fwdHost: "",
      fwdPort: ""
  }


app.use(session({
  store: new MongoStore({
      clientPromise: clientInstancePromise
      // url: DATABASE_URL.href
  }),
  secret: SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7 * 1 // one week
  }
}));

// app.use(session({
//   secret: process.env.SECRET_KEY,
//   resave: false,
//   saveUninitialized: false
// }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors()); //PLEASE REMOVE FOR PRODUCTION

app.use( PREFIX ,express.static('manager/dist'))
app.use( "/clients" ,express.static('clients'), serveIndex('clients', {'icons': true}))
log.info("Listening path:", PREFIX)

app.get('/', (req, res) => {
    res.send('Socket Manager')
})

app.get('/favicon.ico', (req, res) => res.status(204));

app.post(PREFIX_SCHEMA, (req, res) => {
  res.json(schema)
})

app.post(PREFIX_CREATE, async (req, res) => {
  let room = req.body
  let json = new JSONData("server","onOpenRoom",{room:room})
  sio.rooms.set(room.name,room)
  await sio.onOpenRoom(json)
  res.json("success");
})
app.post(PREFIX_READ, (req, res) => {
  let roomArray = Array.from(sio.rooms.values())
  res.json(roomArray)
})
app.post(PREFIX_UPDATE, (req, res) => {
  let room = req.body

  let jsonclose = new JSONData("server","onCloseRoom",{room:room})
  sio.onCloseRoom(jsonclose)
  .then(()=>{
    let jsonopen = new JSONData("server","onOpenRoom",{room:room})
    sio.rooms.set(room.name,room)
    return sio.onOpenRoom(jsonopen)
  })
  .then(()=>{
    return res.json("success");       
  })  

})

app.post(PREFIX_DELETE, async (req, res) => {
  let room = req.body
  let json = new JSONData("server","onCloseRoom",{room:room})
  await sio.onCloseRoom(json)
  sio.rooms.delete(room.name)
  res.json("success");
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
