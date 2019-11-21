const express = require('express');
const app = express();
const createError = require('http-errors');
const expressWebSocket = require('express-ws');
const RP = require("./rp.js")
expressWebSocket(app, null, { perMessageDeflate: false, });


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => res.send('Hello World!'))
let rp = new RP(null,app)
rp.start()

// catch 404 and forward to error handler
// app.use((req, res, next) => {
//   next(createError(404));
// });

// // error handler
// app.use((err, req, res) => {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });
module.exports = app;
