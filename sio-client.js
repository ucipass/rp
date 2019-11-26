const io = require('socket.io-client');
var log = require("ucipass-logger")("sio-client")
log.transports.console.level = 'debug'
log.transports.file.level = 'error'
const File = require("ucipass-file")
const JSONData = require('./jsondata.js')

class SockeIoClient  {
    constructor(url,username,password) {
        this.url = "http://localhost:3000"
        this.username = username ? username : "test"
        this.password = password ? password : "test"
        this.socket = null
        this.stopped = false
        this.sockedId = null
        this.auth = false
    }

    onData (data,replyFn){
        log.debug(`${this.socket.id} received data`)
        if (replyFn) {
            log.debug(`${this.sockedId} sent ack`)
            replyFn('ack')
        }

    }

    onJson (data,replyFn){
        let json = (new JSONData()).setjson(JSON.parse(data))
        if ( json.type() = 'ctrl' ) {
            log.error(`${this.socket.id} received ctrl JSON message`)
        } else{
            log.error(`${this.socket.id} received unknown JSON Type`)
        }
        
        if (replyFn) {
            log.debug(`${this.sockedId} sent ack`)
            replyFn('ack')
        }     

    }

    start(iourl,options){
        return new Promise((resolve, reject) => {
            let opt = options ? options : { reconnection: false }
            let url = iourl ? iourl : 'http://localhost:3000'
            this.socket = io( url , opt );

            this.socket.on('connect', ()=>{
                log.info("Connected:",this.socket.id)
                this.sockedId = this.socket.id
                resolve(this.socket)
            })    

            this.socket.on('data', this.onData.bind(this));

            this.socket.on('json', this.onJson.bind(this));

            this.socket.on('disconnect', (reason) => {
                if (reason === 'io server disconnect') {
                  // the disconnection was initiated by the server, you need to reconnect manually
                  log.info("disconnect reason:",reason)
                }
                // else the socket will automatically try to reconnect
              });

            this.socket.on('reconnect', (attemptNumber) => {
                log.debug("successful reconnect no:",attemptNumber)
            });

            this.socket.on('reconnect_attempt', (attemptNumber) => {
                log.debug("reconnect_attempt no:",attemptNumber)
            });

            this.socket.on('reconnecting', (attemptNumber) => {
                log.debug("reconnecting no:",attemptNumber)
              });

            this.socket.on('reconnect_error', (error) => {
                log.debug("reconnect_error:",error.message)
            });
            
            this.socket.on('reconnect_failed', () => {
                log.debug("reconnect_failed:")
            });
            
            this.socket.on('connect_error', (error)=>{
                log.error("connect_error:",error.message)
                reject(true)
            })
            
            this.socket.on('connect_timeout', (error)=>{
                log.error("connect_timeout:",error.message)
                reject(true)
            })            

            this.socket.on('error', (error)=>{
                if (this.stopped){
                    log.info(`client ${this.sockedId} already stopped error:`,error.message)
                    reject(true)     
                }else{
                    log.error("error:",error.message)
                    reject(true)                    
                }

            })            

            this.socket.on('pong', (latency) => {
                log.debug(`pong ${this.socket.id} latency:`,latency)
            });
        });

    }

    stop(){
        this.stopped = true
        return new Promise((resolve, reject) => {
            this.socket.close(true)
            log.info(`client ${this.sockedId} close complete`)
            resolve(true)
        });

    }

    login(data){
        return new Promise((resolve, reject) => {
            this.socket.emit('login',data,(replyData)=>{
                if(replyData == 'ack'){
                    log.info(`${this.socket.id} login success`)
                    resolve(replyData) 
                }else{
                    log.error(`${this.socket.id} login failure`)
                    resolve(replyData)
                }
            })            
        });
    }

    logout(data){
        return new Promise((resolve, reject) => {
            this.socket.emit('logout',data,(replyData)=>{
                if(replyData == 'ack'){
                    log.info(`${this.socket.id} logout success`)
                    resolve(replyData) 
                }else{
                    log.error(`${this.socket.id} logout failure`)
                    resolve(replyData)
                }
            })            
        });
    }

    emit(json){
        return new Promise((resolve, reject) => {
            log.debug(`${this.sockedId} sent data`)
            this.socket.emit('data',json,(replyData)=>{
                log.debug(`${this.sockedId} sent data reply received`)                
                resolve(replyData) 
            })
        })
    }

    getSocketId(){
        return this.getSocketId
    }
}

module.exports = SockeIoClient