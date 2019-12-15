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
let rooms = new Map();
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

app.get('/', (req, res) => {
    res.send('Socket Manager')
})

app.post('/schema', (req, res) => {
  res.json(schema)
})
app.post('/create', (req, res) => {
  rooms.set(req.body.name,req.body)
  json = new JSONData("server","onRoomRefresh",{rooms:rooms.values()})
  events.emit("onRoomRefresh",json)
  res.json("success");
})
app.post('/read', (req, res) => {
  let rooms = Array.from(sio.rooms.values())
  res.json(rooms)
})
app.post('/update', (req, res) => {
  rooms.set(req.body.name,req.body)
  json = new JSONData("server","onRoomRefresh",{rooms:rooms.values()})
  events.emit("onRoomRefresh",json)
  res.json("success");
})
app.post('/delete', (req, res) => {
  rooms.delete(req.body.name)
  json = new JSONData("server","onRoomRefresh",{rooms:rooms.values()})
  events.emit("onRoomRefresh",json)
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
