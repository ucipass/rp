let net = require('net');

class echoServer {
    
    constructor(PORT) {
        this.PORT = PORT;
        this.server = null;
    }
    start(){
        this.server = net.createServer(function(socket) {
            // socket.write('Echo server listening on', PORT);
            socket.pipe(socket);
        });
        this.server.listen(this.PORT, '127.0.0.1');
        console.log('EchoServer: listening on', this.PORT);
    }
    stop(){
        return new Promise((resolve, reject) => {
            this.server.close(()=>{
                console.log('EchoServer:stopped on port', this.PORT);
                resolve()
            }) 
        });
    }
}

module.exports = echoServer