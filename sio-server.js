socketio = require('socket.io')
var log = require("ucipass-logger")("sio-server")
log.transports.console.level = 'debug'
log.transports.file.level = 'error'

class SIO  {
    constructor() {
        this.io = null
        this.sockets = new Set()
        this.latency = 0
    }
    
    start(server){
        this.io = socketio(server)
        this.io.on('connection', this.onConnection.bind(this))
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
        this.sockets.add(socket)
        socket.auth = true //temporary allowed
        log.info('Socket.io user connected:',socket.id);

        socket.on('disconnect', ()=>{
            this.sockets.delete(socket)
            log.info('Socket.io user disconnected:',socketId);
        })

        socket.on('data', (data,replyFn) =>{
            if (! socket.auth){
                log.error(`invalid data, ${socket.id} is not authenticated`)
                replyFn('denied')
            }else{
                log.debug("data recevied from",socket.id)
                // socket.to('all').emit('data','hello')
                replyFn('ack')
            }
        });

        socket.on('pong', (latency) => {
            this.latency = latency
            log.debug("pong socket.id latency:",latency)
        });

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
        let socketIds = new Set()
        this.sockets.forEach(socket => socketIds.add(socket.id))
        return socketIds;
    }

    getSocketById(socketId){
        return [...this.sockets].find((socket) => socket.id == socketId)
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