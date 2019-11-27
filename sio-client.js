const io = require('socket.io-client');
var log = require("ucipass-logger")("sio-client")
log.transports.console.level = 'error'
log.transports.file.level = 'error'
const File = require("ucipass-file")
const JSONData = require('./jsondata.js')

class SockeIoClient  {
    constructor(url,username,password) {
        this.url = "http://localhost:3000"
        this.username = username ? username : "anonymous"
        this.password = password ? password : "anonymous"
        this.socket = null
        this.stopped = false
        this.sockedId = null
        this.auth = false
        this.log = log
    }

    start(iourl,options){
        return new Promise((resolve, reject) => {
            let opt = options ? options : { reconnection: false }
            let url = iourl ? iourl : this.url
            this.socket = io( url , opt );

            this.socket.on('connect', async ()=>{
                log.info(`${this.socket.id} connected`)
                this.sockedId = this.socket.id
                if (this.username != "anonymous")
                    {
                        await this.login.call(this, this.username, this.password)
                    }
                return resolve(this.socket)
            })    

            this.socket.on('data', this.onData.bind(this));

            this.socket.on('json', this.onJson.bind(this));

            this.socket.on('disconnect', (reason) => {
                  log.info("disconnect reason:",reason)
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
            log.debug(`${this.socket.id}(${this.username}) close initiated`)
            let timer = setTimeout(() => {
                this.socket.disconnect()
                log.error(`${this.socket.id}(${this.username}) close complete with timeout`)
                return resolve(true) 
            }, 3000);        
            this.socket.emit('close','close',()=>{
                clearTimeout(timer)
                log.info(`${this.socket.id}(${this.username}) close completed`)
                this.socket.disconnect()
                return resolve(true)                
            })

                

        });

    }

    login(user,pass){
        let username = user ? user : this.username
        let password = pass ? pass : this.password
        return new Promise((resolve, reject) => {
            this.socket.emit('login',{username:username, password:password},(replyData)=>{
                if(replyData == 'ack'){
                    log.info(`${this.socket.id}(${this.username}) login success`)
                    this.auth = true;
                    return resolve(replyData) 
                }else{
                    log.warn(`${this.socket.id}(${this.username}) login failure`)
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
                    log.info(`${this.socket.id}(${this.username}) logout success`)
                    resolve(replyData) 
                }else{
                    log.error(`${this.socket.id}(${this.username}) logout failure`)
                    resolve(replyData)
                }
            })            
        });
    }

    emit(json){
        return new Promise((resolve, reject) => {
            log.debug(`${this.socket.id}(${this.username}) sent json`)
            this.socket.emit('json',json.str,(replyData)=>{
                log.debug(`${this.socket.id}(${this.username}) received json acknowledment`)
                let jsondata = new JSONData()
                jsondata.str = replyData
                return resolve(jsondata) 
            })
        })
    }

    getSocketId(){
        return this.getSocketId
    }

    onData (data,replyFn){
        log.debug(`${this.socket.id}(${this.username}) received data`)
        if (replyFn) {
            log.debug(`${this.socket.id}(${this.username}) sent ack`)
            replyFn('ack')
        }

    }

    onJson (data,replyFn){
        let json = new JSONData()
        try {
            json.setjson(JSON.parse(data))
        } catch (error) {
            log.debug(`${this.socket.id}(${this.username}) received unknown JSON Type`)
        }

        let jsonReply = new JSONData()
        jsonReply.str = json.str
        if ( json.type == 'onSendPrivateMsg' ) {
            log.debug(`${this.socket.id}(${this.username}) received onPrivateRoomMsg JSON message`)
        } 
        else if ( json.type == 'onSendRoomMsg' ) {
            log.debug(`${this.socket.id}(${this.username}) received onSendRoomMsg JSON message`)
        } 
        else{
            log.debug(`${this.socket.id}(${this.username}) received unknown JSON Type`)
            jsonReply.att = "Uknown JSON Type"
        }
        
        if (replyFn) {
            jsonReply.id = this.username
            jsonReply.att.msg = "ack"
            log.debug(`${this.socket.id}(${this.username}) sent onJson ack`)
            replyFn(jsonReply.str)
        }     

    }


}

module.exports = SockeIoClient