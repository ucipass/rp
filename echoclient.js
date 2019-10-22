let net = require('net');

class echoClient {
    
    constructor(PORT, CONCURRENCY, CONNECTION_COUNT) {
        this.PORT = PORT;
    }

    send (sendData){
        let _client = new net.Socket();
        let PORT = this.PORT
        let resolve,reject
        let p = new Promise((res, rej) => { resolve = res; reject = rej});
        _client.connect( PORT, '127.0.0.1', function() {
            console.log('EchoClient: connected to port', PORT);
            _client.write(sendData)
        });

        _client.on('data', function(recvData) {
            if (recvData == sendData){
                let message = 'EchoClient: received data matching: '+recvData
                console.log(message);
                resolve(message)
            }else{
                let message = 'EchoClient: received data' + recvData+ ' NOT matching: '+ sendData
                console.log(message);
                reject(message)
            }
            _client.destroy(); // kill client after server's response
        });
        
        _client.on('close', function() {
            console.log('EchoClient: connection closed');
        });
        
        setTimeout(() => {
            let message = 'EchoClient: sent data' + sendData+ ', but TIMEOUT occured!'
            reject(message)            
        }, 1000);
        return p
    }

    multi_send(array,concurrent){
        // for (let index = 0; index < conns.length; index++) {
        //     curConnection = conns[index]
        //     echoclient = new Echoclient(CLIENT_PORT);
        //     if (concurrency){
        //         curConnection.promise = echoclient.send(curConnection.message)
        //     }else{
        //         curConnection.promise = await echoclient.send(curConnection.message)
        //     }
        // }
        // for (let index = 0; index < conns.length; index++) {
        //     await conns[index].promise;
        // }
    }
}

module.exports = echoClient