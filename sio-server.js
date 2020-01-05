const socketio = require('socket.io')
const path = require('path')
const config = require('config');
const JSONData = require('./jsondata.js')
var log = require("ucipass-logger")("sio-server")
log.transports.console.level = 'error'
// log.transports.file.level = 'error'

class SIO  {
    constructor(server) {
        this.prefix = process.env.VUE_APP_PREFIX ? process.env.VUE_APP_PREFIX : "/" 
        this.sio_path = path.posix.join("/", this.prefix, "socket.io")
        this.sio_opts = { path: this.sio_path }
        this.sockets = new Map()
        this.rooms = new Map()
        this.users = new Map()
        this.connections = new Map()
        this.latency = 0
        this.log = log;
        this.io = socketio( server, this.sio_opts)
        log.info("Listening path:", this.sio_path.toString() )
        this.io.on('connection', this.onConnection.bind(this))
        // this.loadRoomDB( config.get("roomDB") )
        this.events = require('./events.js')
        this.events.emit("onSocketIoStarted",this)
    }

    onConnection(socket){
        let socketId = socket.id
        this.sockets.set(socketId,socket)
        socket.auth = true //temporary allowed
        log.info(`${socketId} connected`);

        socket.on('disconnect', (data)=>{
            log.info(`${socketId}(${socket.username}) disconnect event`);
            this.sockets.delete(socketId)
        })

        socket.on('close', (data,replyFn)=>{
            replyFn('ack')
            socket.disconnect()
            log.info(`${socketId}(${socket.username}) client intiated close completed`);
        })

        socket.on('pong', (latency) => { this.latency = latency });

        socket.on('login', (data,replyFn)  => { this.onLogin.call(this,socket,data,replyFn ) })

        socket.on('logout', (data,replyFn) => { this.onLogout.call(this,socket,data,replyFn) })

        socket.on('onTcpConnRequest', (data,replyFn) => { this.onTcpConnRequest.call(this,socket,data,replyFn) })

        socket.on('onTcpConnClose', (data,replyFn) => { this.onTcpConnClose.call(this,socket,data,replyFn) })

        socket.on('onData', (data,replyFn) => { this.onData.call(this,socket,data,replyFn) })

        socket.on('onSendPrivateMsg', (data,replyFn) => { this.onSendPrivateMsg.call(this,socket,data,replyFn) });

    }
    
    async stop(){
        let reply = new Promise((resolve, reject) => {
            this.events.removeListener('onRoomRefresh',()=>{});
            this.io.close(()=>{
                log.info("server close complete",()=>{
                    resolve(true)
                })
            })
        });
        return reply
    }
    // Calls onNewClient if login successful
    async onLogin (socket,data,replyFn){
        socket.auth = await this.authFn(data)
        if (socket.auth) {
            socket.username = data.username
            log.info(`${socket.id}(${socket.username}) login success`)
            replyFn('ack')
            this.onNewClient(socket)
        }else{
            log.warn(`${socket.id} login ${socket.username} failure`)
            replyFn('reject')
        }
    }

    async onLogout(socket,data,replyFn){
        socket.auth = false
        replyFn('ack')
    }

    async onNewClient(socket){    
        this.rooms.forEach((room)=>{
            if( room.rcvName == socket.username  || room.fwdName == socket.username ){
                log.info(`${socket.id}(${socket.username}) joining ${room.name} room !`)  
                socket.join(room.name,(err)=>{
                    if (err) log.error(`${socket.id}(${socket.username}) failed to join ${room.name} room !`, err)
                })
                let json = new JSONData("server","onOpenRoom",{room:room})
                socket.emit("onOpenRoom",json,()=>{})                       
            }
        })
    }

    async onOpenRoom(data){
        let json = (new JSONData()).setjson(data.json)
        let room = json.att.room
        room.connections = new Map()
        this.rooms.set(room.name,room)

        this.sockets.forEach(async socket => {
            await new Promise((resolve, reject) => {
                if (socket.username == room.rcvName || socket.username == room.fwdName){
                    socket.join(room.name,(err)=>{
                        if (err){
                            log.error(`${socket.id}(${socket.username}) failed to join ${room.name} room !`, err)
                        }else{
                            log.info(`${socket.id}(${socket.username}) joined ${room.name} room !`)              
                        }
                    })  
                    socket.emit("onOpenRoom",json,()=>{
                        resolve(true)
                    })
                }                
            });
        });
    }

    async onCloseRoom(data){
        let json = (new JSONData()).setjson(data.json)
        let room = this.rooms.get(json.att.room.name)
        let socketIds = room.name ? await this.getRoomMembers(room.name) : []
        for (const socketId of socketIds) {
            await new Promise((resolve, reject) => {
                let socket = this.sockets.get(socketId)
                socket.emit("onCloseRoom",json,()=>{
                    log.debug(`${socket.id}(${socket.username}) replied that room is closed!`)
                    socket.leave(room.name,(err)=>{
                        if (err){
                            log.error(`${socket.id}(${socket.username}) failed to leave ${room.name} room !`, err)
                            reject(`${socket.id}(${socket.username}) failed to leave ${room.name} room !`)
                        }else{
                            log.info(`${socket.id}(${socket.username}) left ${room.name} room !`)       
                            resolve(`${socket.id}(${socket.username}) left ${room.name} room !`)
                        }
                    })                      
                })
                
            });            
        }

        this.rooms.delete(room.name)  
    }

    async onData(socket, data, replyFn){
        try {
            let room = this.rooms.get(data.room)
            let connection = room.connections.get(data.connectionId)
            let otherSocket = null
            if (socket.id == connection.rcvSocketId){
                otherSocket = this.getSocketById(connection.fwdSocketId)
            }else{
                otherSocket = this.getSocketById(connection.rcvSocketId)
            }
            if(replyFn) replyFn(data)
            otherSocket.emit('onData', data,)
            
            // socket.to(connection.room).emit('onData', data );
        } catch (error) {
            return log.error("invalid JSON data received from client")
        }
        
    }

    async onTcpConnRequest(socket, data, replyFn){
        if (!data.json){
            return replyFn({json:{data:data,err:"invalid JSON received"}})
        }
        let json = (new JSONData()).setjson(data.json)


        let members = await this.getRoomMembers(json.att.room)
        let filtered = members.filter( (member)=> member != socket.id )
        //check if other side exists
        if (filtered.length != 1){
            json.err = `${socket.id}(${socket.username}) no other member in room ${json.att.room}`
            return replyFn(json)
        }   

        let otherSocket = this.getSocketById( filtered[0] )
        let room = this.rooms.get(json.att.room)
        let connection = {
            connectionID : json.att.connectionID,
            rcvSocketId : socket.id,
            fwdSocketId: otherSocket.id,
            room : json.att.room,
            localSrcPort: json.att.localSrcPort, 
            localDstPort: json.att.localDstPort,
            remoteSrcPort: null, 
            remoteDstPort: room.fwdPort,
            remoteHost: room.fwdHost,
            rcvName: room.rcvName,
            rcvPort: room.rcvPort,
            fwdName: room.fwdName,
            fwdHost: room.fwdHost,
            fwdPort: room.fwdPort
        }
        json.att.connection = connection

        log.debug(`forwarding onTcpConnRequest ${socket.id}(${socket.username}) -> ${otherSocket.id}(${otherSocket.username})`)
        otherSocket.emit("onTcpConnRequest",json,(replyData)=>{
            let replyJson = (new JSONData()).setjson(replyData.json)
            room.connections.set(json.att.connectionID, replyJson.att.connection ) 
            log.debug(`forwarding onTcpConnRequest acknowledgement ${otherSocket.id}(${otherSocket.username}) -> ${socket.id}(${socket.username})`)
            replyFn(replyJson)
        })            

    }

    async onTcpConnClose(socket, data,replyFn){
        let json = (new JSONData().setjson(data.json))
        let room = this.rooms.get(json.att.room)
        if(room && room.connections){
            room.connections.delete(json.att.connectionId)
        }
        socket.to(json.att.room).emit("onTcpConnClose",json)
        json.id = "server"
        json.att.msg = 'ack'
        replyFn(json)
    }

    async onSendPrivateMsg(socket, data, replyFn){
        let json = (new JSONData()).setjson(data.json)
        let members = await this.getRoomMembers(json.att.room)
        let filtered = members.filter( (member)=> member != socket.id )
        if ( filtered.length == 1) {
            let otherSocket = this.getSocketById( filtered[0] )
            log.debug(`forwarding message ${socket.id}(${socket.username}) -> ${otherSocket.id}(${otherSocket.username})`)
            otherSocket.emit(json.type,json,(replyData)=>{
                let replyJson = (new JSONData()).setjson(replyData.json)
                log.debug(`forwarding acknowledgement ${otherSocket.id}(${otherSocket.username}) -> ${socket.id}(${socket.username})`)
                return replyFn(replyJson)
            })

        }else{
            log.error(`${socket.id} does not have another member in room: ${json.att.room}`)
            json.err = `${socket.id} does not have another member in room: ${json.att.room}`
            return replyFn(json)
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
            let newRoom = JSON.parse(JSON.stringify(room))
            newRoom.connections = new Map() // add object for future connections
            this.rooms.set(newRoom.name,newRoom)
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
                        log.error(`${socket.id}(${socket.username}) failed to join ${room} room !`, err)
                        return resolve(`${socket.id}(${socket.username}) failed to join ${room} room !`)
                    }else{
                        log.info(`${socket.id}(${socket.username}) joined ${room} room !`)
                        return resolve(socketId)                   
                    }
                })  
            }else{
                log.error(`${socket.id}(${socket.username}) is not allowed to join ${room} room !`)
                return resolve(`${socket.id}(${socket.username}) is not allowed in ${room} room !`)
            }      
        });
    }

    async leaveRoom(room,socketId){
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

if (require.main === module) {
    var argv = require('minimist')(process.argv.slice(2));
    if ( argv.p){
        const express = require('express')
        const app = express()
        const port = argv.p
        app.get('/', (req, res) => res.send('Hello World!'))       
        let server = app.listen(port, "0.0.0.0", () => console.log(`Socket.io standalone mode listening on port ${port}!`))
        let sio = new SIO(server)
    }else{
        console.log( "need -p for tcp port")
    }
}