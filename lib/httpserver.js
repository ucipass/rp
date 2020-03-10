var log = require("ucipass-logger")("httpserver")
log.transports.console.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL :'info'

class Server{
  constructor(config){
    this.app = config.app
    this.port = config.port ? config.port : 8080
    this.server = null
    this.lastSocketKey = 0;
    this.socketMap = {};
    this.startedFn = null
  }

  start(){
    if(this.app) {
      this.server = this.app.listen(this.port);
    }else{
      this.server = require('http').createServer().listen(this.port);            
    }
    this.server.on('error', this.onError.bind(this));
    this.server.on('listening', ()=>{
      const addr = this.server.address();
      const bind = typeof addr === 'string' ? `pipe ${addr}`: `port ${addr.port}`;
      log.info(`server listening on: ${bind}`);
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
        log.debug("server is stopped!");
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
  
    const bind = typeof port === 'string' ? `Pipe` : `Port ${this.port}`;
  
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

module.exports = Server;
