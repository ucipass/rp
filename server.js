const app = require("./app.js")

const port = 3000
var lastSocketKey = 0;
var socketMap = {};
let startedFn = null
const server = app.listen(port);
server.started = new Promise((resolve, reject) => { startedFn = resolve });

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

const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === 'string'
      ? `pipe ${addr}`
      : `port ${addr.port}`;
  console.info('\n\n*********** STARTING service **************');
  console.info(`Web server listening at: ${bind}`);
  startedFn(true)
};

const onConnection = (socket) => {
  /* generate a new, unique socket-key */
  var socketKey = ++lastSocketKey;
  /* add socket when it is connected */
  socketMap[socketKey] = socket;
  socket.on('close', function() {
      /* remove socket when it is closed */
      delete socketMap[socketKey];
  });
};
  
server.on('error', onError);
server.on('listening', onListening);
server.on('connection', onConnection);
server.stop = ()=>{
  return new Promise((resolve, reject) => {

    for (var socketId in this.socketMap) {
      this.socketMap[socketId].destroy();
    }        

    server.close(()=>{
      console.log("Server is stopped!");
      setTimeout(() => {
          server.unref()
          resolve(true)
      }, 1000);
    })
    
  });
}  

module.exports = server;