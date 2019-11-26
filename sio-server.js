socketio = require('socket.io')
var log = require("ucipass-logger")("sio-server")
log.transports.console.level = 'debug'
log.transports.file.level = 'error'

class SIO  {
    constructor(server) {
        this.io = socketio(server)
        this.io.on('connection', this.onConnection.bind(this))
        this.sockets = new Map()
        this.latency = 0  
    }
    
    start(server){
        // this.io = socketio(server)
        
    }

    stop(){
        return new Promise((resolve, reject) => {
            this.io.close(()=>{
                log.info("server close complete",()=>{
                    resolve(true)
                })
            })
        });

    }

    onConnection(socket){
        let socketId = socket.id
        this.sockets.set(socketId,socket)
        socket.auth = true //temporary allowed
        log.info('Socket.io user connected:',socketId);

        socket.on('disconnect', ()=>{
            this.sockets.delete(socketId)
            log.info('Socket.io user disconnected:',socketId);
        })

        socket.on('login', async (data,replyFn)=>{
            data.socketId = socketId;
            socket.auth = await this.login(data)
            if (socket.auth) {
                log.info(`${socket.id} login success`)
                replyFn('ack')
            }else{
                log.error(`${socket.id} login failure`)
                replyFn('reject')
            }
        })

        socket.on('logout', async (data,replyFn)=>{
            socket.auth = false
            replyFn('ack')
        })

        socket.on('data', (data,replyFn) =>{
            if (! socket.auth){
                log.error(`invalid data, ${socket.id} is not authenticated`)
                replyFn('denied')
            }else{
                log.debug("data recevied from",socket.id)
                socket.to('all').emit('data',data)
                replyFn('ack')
            }
        });

        socket.on('json', async (data,replyFn) =>{
            if (! socket.auth){
                log.error(`data rejected, ${socket.id} is not authenticated`)
                replyFn('denied')
                return;
            }

            log.debug("data recevied from",socket.id)
            let json = (new JSONData()).setjson(JSON.parse(data))
            let reply = await this.onJson.call(this,socket,json)
            replyFn(reply)
        });

        socket.on('pong', (latency) => {
            this.latency = latency
            log.debug("pong socket.id latency:",latency)
        });

    }

    async onJson(socket,json){
        console.log(json)
    }

    async login(data){
        if (data.username == 'test' && data.password == 'test'){
            return true
        }else{
            return false
        }
    }
    
    getRooms(){
        return this.io.sockets.adapter.rooms  
    }

    getRoomMembers(room){
        return new Promise((resolve, reject) => {
            this.io.of('/').in(room).clients((error, clients) => {
                if (error) {
                    log.error(error)
                    reject(error)
                }else{
                    log.debug(`clients in ${room}:`,clients)
                    resolve(clients)
                }
                
            });              
        });
    }

    getSocketIds(){
        return this.sockets.keys();
    }

    getSocketById(socketId){
        return this.sockets.get(socketId)
    }

    joinRoom(room,socketId){
        return new Promise((resolve, reject) => {
            let socket = this.getSocketById(socketId)
            socket.join(room,(err)=>{
                if (err){
                    log.error(err)
                }else{
                    log.info(`${room} room join: ${socketId}`)
                    resolve(socketId)                   
                }
            })            
        });
    }

    leaveRoom(room,socketId){
        return new Promise((resolve, reject) => {
            let socket = this.getSocketById(socketId)
            socket.leave(room,(err)=>{
                if (err){
                    log.error(err)
                }else{
                    log.info(`${room} room leave: ${socketId}`)
                    resolve(socketId)                   
                }
            })            
        });
    }

}

module.exports = SIO