socketio = require('socket.io')
const JSONData = require('./jsondata.js')
var log = require("ucipass-logger")("sio-server")
log.transports.console.level = 'error'
log.transports.file.level = 'error'

class SIO  {
    constructor(server) {
        this.io = socketio(server)
        this.io.on('connection', this.onConnection.bind(this))
        this.sockets = new Map()
        this.rooms = new Map()
        this.users = new Map()
        this.latency = 0
        this.log = log;
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

        socket.on('disconnect', (data)=>{
            this.sockets.delete(socketId)
            log.info(`${socketId} disconnect event`);
        })

        socket.on('close', (data,replyFn)=>{
            replyFn('ack')
            socket.disconnect()
            // this.sockets.delete(socketId)
            log.info(`${socketId} client intiated close completed`);
        })

        socket.on('login', (data,replyFn)  => { this.onLogin.call(this,socket,data,replyFn ) })

        socket.on('logout', (data,replyFn) => { this.onLogout.call(this,socket,data,replyFn) })

        socket.on('json', async (data,replyFn) =>{
            if (! socket.auth){
                log.error(`invalid data, ${socket.id} is not authenticated`)
                return replyFn('authentication denied')
            }else{
                log.debug("data recevied from",socket.id)
            }

            let json = new JSONData()
            try {
                json.setjson(JSON.parse(data))
                let reply = await this.onJson.call(this,socket,json)
                return replyFn(reply.str)
            } catch (error) {
                let msg = error.toString()
                log.error("not valid JSON",msg)
                return replyFn(msg)
                
            }            
        });

        socket.on('pong', (latency) => {
            this.latency = latency
            log.debug("pong socket.id latency:",latency)
        });

    }

    async onLogin (socket,data,replyFn){
        socket.auth = await this.authFn(data)
        if (socket.auth) {
            socket.username = data.username
            log.info(`${socket.id} login ${socket.username} success`)
            replyFn('ack')
        }else{
            log.warn(`${socket.id} login ${socket.username} failure`)
            replyFn('reject')
        }
    }

    async onLogout(socket,data,replyFn){
        socket.auth = false
        replyFn('ack')
    }

    async onJson(socket, json){
        
        if ( json.type == "ping") { return ( await this.onPing.call(this,socket,json) ) }
        else if ( json.type == "onSendRoomMsg") { return await this.onSendRoomMsg.call(this,socket,json) }
        else if ( json.type == "onSendPrivateMsg") { return await this.onSendPrivateMsg.call(this,socket,json) }
        else{
            json.type = json.type + "-reply"
            json.err = "nomatch"
            return json
        }

    }

    async onPing(socket, json){
        json.type = "pong"
        return json.toString()
    }

    async onSendRoomMsg(socket, json){
        socket.to("room1").emit("json",json.str)
        return json
    }

    async onSendPrivateMsg(socket, json){
        let members = await this.getRoomMembers(json.att.room)
        let filtered = members.filter( (member)=> member != socket.id )
        if ( filtered.length == 1) {
            let otherSocket = this.getSocketById( filtered[0] )
            log.debug(`forwarding ${socket.id} message to ${otherSocket.id}`)
            let waitForReply = await new Promise((resolve, reject) => {
                otherSocket.emit("json",json.str,(replyData)=>{
                    let replyJson = new JSONData()
                    replyJson.str = replyData
                    log.info(`forwarding ${otherSocket.id} acknowledgement to ${socket.id}`)
                    return resolve(replyJson)
                })
            });
            return waitForReply

        }else{
            log.error(`${socket.id} does not have another member in room: ${json.att.room}`)
            json.err = `${socket.id} does not have another member in room: ${json.att.room}`
            return json
        }
        
    }


    async authFn(data){
        if (
            data.username == 'test' && data.password == 'test' ||
            data.username == 'client1' && data.password == 'client1' ||
            data.username == 'client2' && data.password == 'client2' ||
            data.username == 'client3' && data.password == 'client3' ||
            data.username == 'client4' && data.password == 'client4' 
            ){
            return true
        }else{
            return false
        }
    }
    
    getRooms(){
        return this.io.sockets.adapter.rooms  
    }

    loadRoomDB(roomDB){
        roomDB.forEach(room => {
            this.rooms.set(room.name,room)
        });
    }

    loadUserDB(userDB){
        userDB.forEach(user => {
            this.users.set(user.username,user)
        });
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

    async joinRoom(room,socketId){
        return new Promise((resolve, reject) => {
            let socket = this.getSocketById(socketId)
            let user = this.users.get(socket.username)
            if ( user && user.rooms && user.rooms.includes(room) ){
                socket.join(room,(err)=>{
                    if (err){
                        log.error(`${socket.username} failed to join ${room} room !`, err)
                        return resolve(`${socket.username} failed to join ${room} room !`)
                    }else{
                        log.info(`${socket.username} joined ${room} room !`)
                        return resolve(socketId)                   
                    }
                })  
            }else{
                log.error(`${socket.username} is not allowed to join ${room} room !`)
                return resolve(`${socket.username} is not allowed in ${room} room !`)
            }          
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