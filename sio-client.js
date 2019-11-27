const io = require('socket.io-client');
var log = require("ucipass-logger")("sio-client")
log.transports.console.level = 'error'
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
        this.log = log
    }

    onData (data,replyFn){
        log.debug(`${this.socket.id} received data`)
        if (replyFn) {
            log.debug(`${this.sockedId} sent ack`)
            replyFn('ack')
        }

    }

    onJson (data,replyFn){
        let json = new JSONData()
        try {
            json.setjson(JSON.parse(data))
        } catch (error) {
            log.warn(`${this.socket.id} received unknown JSON Type`)
        }

        let jsonReply = new JSONData()
        jsonReply.str = json.str
        if ( json.type == 'onSendPrivateMsg' ) {
            log.warn(`${this.socket.id} received onPrivateRoomMsg JSON message`)
        } 
        else if ( json.type == 'onSendRoomMsg' ) {
            log.warn(`${this.socket.id} received onSendRoomMsg JSON message`)
        } 
        else{
            log.warn(`${this.socket.id} received unknown JSON Type`)
            jsonReply.att = "Uknown JSON Type"
        }
        
        if (replyFn) {
            jsonReply.id = this.username
            jsonReply.att.msg = "ack"
            log.debug(`${this.sockedId} sent ack`)
            replyFn(jsonReply.str)
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
                return resolve(this.socket)
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
            log.debug(`client ${this.sockedId} close initiated`)
            let timer = setTimeout(() => {
                this.socket.disconnect()
                log.info(`client ${this.sockedId} close complete with timeout`)
                return resolve(true) 
            }, 10000);            
            this.socket.emit('close','close',()=>{
                clearTimeout(timer)
                this.socket.disconnect()
                log.info(`client ${this.sockedId} close completed`)
                return resolve(true)                
            })

                

        });

    }

    login(username,password){
        return new Promise((resolve, reject) => {
            this.socket.emit('login',{username:username, password:password},(replyData)=>{
                if(replyData == 'ack'){
                    log.info(`${this.socket.id} login success`)
                    this.auth = true;
                    return resolve(replyData) 
                }else{
                    log.warn(`${this.socket.id} login failure`)
                    this.auth = false;
                    return resolve(replyData)
                }
            })            
        });
    }

    logout(){
        return new Promise((resolve, reject) => {
            this.socket.emit('logout','logout',(replyData)=>{
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
            log.debug(`${this.sockedId} sent json`)
            this.socket.emit('json',json,(replyData)=>{
                log.debug(`${this.sockedId} sent json reply received`)
                let jsondata = new JSONData()
                jsondata.str = replyData
                return resolve(jsondata) 
            })
        })
    }

    getSocketId(){
        return this.getSocketId
    }
}

module.exports = SockeIoClient