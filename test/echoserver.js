let net = require('net');

class echoServer {
    
    constructor(PORT) {
        this.PORT = PORT;
        this.server = null;
        this.server = null
        this.lastSocketKey = 0;
        this.socketMap = {};
    }
    start(){
        return new Promise((resolve, reject) => {
            this.server = net.createServer((socket)=> {
                let socketId = this.lastSocketKey++;
                this.socketMap[socketId] = socket;
                // socket.write('Echo server listening on', PORT);
                socket.pipe(socket);
                socket.on('close',  () => {
                    //   console.log('socket', socketId, 'closed');
                      delete this.socketMap[socketId];
                    });
            });
            this.server.listen(this.PORT, '127.0.0.1');
            console.log('EchoServer: listening on', this.PORT);
            resolve(true)            
        });
    }
    stop(){
        return new Promise((resolve, reject) => {
            this.server.close(()=>{
                console.log('EchoServer: stopped on port', this.PORT);
                this.server.unref()
                resolve()
            }) 
            for (var socketId in this.socketMap) {
                // console.log('socket', socketId, 'destroyed');
                this.socketMap[socketId].destroy();
            }
        });
    }
}

module.exports = echoServer