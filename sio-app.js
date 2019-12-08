const express = require('express');
const app = express();
const createError = require('http-errors');
const events = require("./events.js")
const JSONData = require("./jsondata.js")


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/openroom', (req, res) => {
  let json = new JSONData("server","onOpenRoom",{room:req.body})
  events.emit("onOpenRoom",json)
  res.status(204).send();
})

app.post('/closeroom', (req, res) => {
  let json = new JSONData("server","onCloseRoom",{room:req.body})
  events.emit("onCloseRoom",json)
  res.status(204).send();
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
