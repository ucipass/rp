const net = require('net');
const log = require("ucipass-logger")("echoclient")
log.transports.console.level = process.env.LOG_ECHOCLIENT ? process.env.LOG_ECHOCLIENT : "error"
// log.transports.file.level = 'error'

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
            log.info('EchoClient: connected to port', PORT);
            _client.write(sendData)
        });

        _client.on('data', (recvData) => {
            this.receivedData = recvData
            _client.destroy(); // kill client after server's response
        });

        _client.on('error', (error) => {
            switch( error.code ){
                case "ECONNREFUSED":
                    log.info("Connection refused to port:", PORT); break;
                default:
                    log.error(error)
            }     
        });
        
        _client.on('close', ()=> {
            log.info('EchoClient: connection closed');
            let recvData = this.receivedData
            if ( this.receivedData == sendData){
                let message = 'EchoClient: received data matching: '+recvData
                log.info(message);
                resolve(recvData.toString())
            }else{
                let message = 'EchoClient: received data' + recvData+ ' NOT matching: '+ sendData
                log.info(message);
                reject(recvData ? recvData.toString() : "NODATA")
            }
        });
        
        // setTimeout(() => {
        //     let message = 'EchoClient: sent data' + sendData+ ', but TIMEOUT occured!'
        //     reject(message)            
        // }, 1000);
        return p
    }

}

module.exports = echoClient