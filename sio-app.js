const express = require('express');
const config = require('config');
const URL = require('url');
const path = require('path')
const PREFIX_SCHEMA = path.posix.join("/", config.server.prefix, "schema")
const PREFIX_CREATE = path.posix.join("/", config.server.prefix, "create")
const PREFIX_READ = path.posix.join("/", config.server.prefix, "read")
const PREFIX_UPDATE = path.posix.join("/", config.server.prefix, "update")
const PREFIX_DELETE = path.posix.join("/", config.server.prefix, "delete")
const app = express();
let sio = null;
let cors = require('cors') //PLEASE REMOVE FOR PRODUCTION
let prefix = config.server.path ? config.server.path : "/"
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

app.use(express.static('manager/dist'))

app.get('/', (req, res) => {
    res.send('Socket Manager')
})

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
app.post(PREFIX_UPDATE, async (req, res) => {
  let room = req.body

  let jsonclose = new JSONData("server","onCloseRoom",{room:room})
  await sio.onCloseRoom(jsonclose)
  sio.rooms.delete(room.name)
  
  let jsonopen = new JSONData("server","onOpenRoom",{room:room})
  sio.rooms.set(room.name,room)
  await sio.onOpenRoom(jsonopen)
  res.json("success");
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
