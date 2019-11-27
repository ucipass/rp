var log = require("ucipass-logger")("testserver")
log.transports.console.level = 'info'
log.transports.file.level = 'error'

class TestServer{
  constructor(app,port){
    this.app = app
    this.server = null
    this.port = port
    this.lastSocketKey = 0;
    this.socketMap = {};
    this.startedFn = null
  }

  start(){
    this.server = this.app.listen(this.port);
    this.server.on('error', this.onError.bind(this));
    this.server.on('listening', ()=>{
      const addr = this.server.address();
      const bind = typeof addr === 'string'
          ? `pipe ${addr}`
          : `port ${addr.port}`;
      log.info('*********** STARTING service **************');
      log.info(`Web server listening at: ${bind}`);
      this.startedFn(this.server)
    });
    this.server.on('connection', this.onConnection.bind(this));
    return new Promise((resolve, reject) => {
        this.startedFn = resolve;
    });
  }

  stop(){
    return new Promise((resolve, reject) => {
  
      for (var socketId in this.socketMap) {
        this.socketMap[socketId].destroy();
      }        
  
      this.server.close(()=>{
        log.info("Server is stopped!");
        setTimeout(() => {
            this.server.unref()
            resolve(true)
        }, 300);
      })
      
    });
  }
  
  onError (error) {
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

  onConnection(socket) {
    /* generate a new, unique socket-key */
    let socketKey = ++this.lastSocketKey;
    /* add socket when it is connected */
    this.socketMap[socketKey] = socket;
    socket.on('close', ()=> {
        /* remove socket when it is closed */
        delete this.socketMap[socketKey];
    });
  };

}

module.exports = TestServer;
