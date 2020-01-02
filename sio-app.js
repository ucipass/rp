var log = require("ucipass-logger")("sio-app")
log.transports.console.level = 'info'
log.transports.file.level = 'error'
const config = require('config');
const path = require('path')
const PREFIX        = process.env.VUE_APP_PREFIX ? path.posix.join("/",process.env.VUE_APP_PREFIX) : "/"
const PREFIX_SCHEMA = path.posix.join("/",PREFIX, "schema")
const PREFIX_CREATE = path.posix.join("/",PREFIX, "create")
const PREFIX_READ   = path.posix.join("/",PREFIX, "read")
const PREFIX_UPDATE = path.posix.join("/",PREFIX, "update")
const PREFIX_DELETE = path.posix.join("/",PREFIX, "delete")
const express = require('express');
const app = express();
let sio = null;
let cors = require('cors') //PLEASE REMOVE FOR PRODUCTION
const createError = require('http-errors');
const events = require("./events.js")
events.on("onSocketIoStarted", (sioInstance)=>{
  sio = sioInstance;
})
const JSONData = require("./jsondata.js")
let schema =  
  {
      name: "",
      rcvName: "",
      rcvPort: "",
      fwdName: "",
      fwdHost: "",
      fwdPort: ""
  }

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use( PREFIX ,express.static('manager/dist'))
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
