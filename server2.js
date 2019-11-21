const app = require("./app.js")

const port = 3000
let startedFn = null
let p = new Promise((resolve, reject) => { startedFn = resolve });
const server = app.listen(port, "0.0.0.0", () => {
    let host = server.address().address;
    let port = server.address().port;
    console.log('RP: Rendezvous Point started at http://%s:%s', host, port);
    startedFn(true)             
});
server.started = p

// this.server.on('connection',  (socket) => {
//     // Add a newly connected socket
//     let socketId = this.lastSocketKey++;
//     this.socketMap[socketId] = socket;
//     // console.log('socket', socketId, 'opened');
  
//     // Remove the socket when it closes
//     socket.on('close',  () => {
//     //   console.log('socket', socketId, 'closed');
//       delete this.socketMap[socketId];
//     });
  
//   });


/**
 * Event listener for HTTP server "error " event.
 */

const onError = (error) => {
    if (error.syscall !== 'listen') {
      throw error;
    }
  
    const bind = typeof port === 'string'
      ? `Pipe ${port}`
      : `Port ${port}`;
  
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`);
        process.exit(1);
        break;
      default:
        throw error;
    }
  };
  
  /**
   * Event listener for HTTP server "listening" event.
   */
  
const onListening = () => {
const addr = server.address();
const bind = typeof addr === 'string'
    ? `pipe ${addr}`
    : `port ${addr.port}`;
console.info('\n\n*********** STARTING service **************');
console.info(`Web server listening at: ${bind}`);
};
server.on('error', onError);
server.on('listening', onListening);
  









module.exports = server;
