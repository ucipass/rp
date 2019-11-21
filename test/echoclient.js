let net = require('net');

class echoClient {
    
    constructor(PORT, CONCURRENCY, CONNECTION_COUNT) {
        this.PORT = PORT;
    }

    send (sendData){
        let _client = new net.Socket();
        let PORT = this.PORT
        let resolve,reject
        let receivedData = null
        let p = new Promise((res, rej) => { resolve = res; reject = rej});
        _client.connect( PORT, '127.0.0.1', function() {
            console.log('EchoClient: connected to port', PORT);
            _client.write(sendData)
        });

        _client.on('data', (recvData) => {
            this.receivedData = recvData
            _client.destroy(); // kill client after server's response
        });
        
        _client.on('close', ()=> {
            console.log('EchoClient: connection closed');
            let recvData = this.receivedData
            if ( this.receivedData == sendData){
                let message = 'EchoClient: received data matching: '+recvData
                console.log(message);
                resolve(recvData.toString())
            }else{
                let message = 'EchoClient: received data' + recvData+ ' NOT matching: '+ sendData
                console.log(message);
                reject(recvData.toString())
            }
        });
        
        setTimeout(() => {
            let message = 'EchoClient: sent data' + sendData+ ', but TIMEOUT occured!'
            reject(message)            
        }, 1000);
        return p
    }

}

module.exports = echoClient