const socketio = require('socket.io')
const path = require('path')
const mongooseclient = require("./mongooseclient.js")
const JSONData = require('./jsondata.js')
var log = require("ucipass-logger")("sio-server")
log.transports.console.level = 'info'
// log.transports.file.level = 'error'

class SIO  {
    constructor(server) {
        this.prefix = process.env.VUE_APP_PREFIX ? process.env.VUE_APP_PREFIX : "/" 
        this.sio_path = path.posix.join("/", this.prefix, "socket.io")
        this.sio_opts = { path: this.sio_path }
        this.sockets = new Map()
        this.rooms = new Map()
        this.users = new Map()
        this.latency = 0
        this.log = log;
        this.io = socketio( server, this.sio_opts)
        log.info("Listening path:", this.sio_path.toString() )
        this.events = require('./events.js')
        this.db = null
    }

    onConnection(socket){
        let address = socket.handshake.address;
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
    
    async start(){

        this.db = await mongooseclient()
        .catch((error)=>{
            log.error("Database connection failure, exiting...")
            log.error(error)
            process.exit()
        })
        await this.refresh() // Load rooms from database
        this.io.on('connection', this.onConnection.bind(this))
        this.events.emit("onSocketIoStarted",this)
        return this; 

    }
    
    async stop(){
        return new Promise((resolve, reject) => {
            this.events.removeListener('onRoomRefresh',()=>{});
            this.io.close(()=>{
                log.info("server close complete",()=>{
                    resolve(true)
                })
            })
        })
        .then(()=> this.db.close() )
    }

    async refresh(){
        let newrooms = await this.db.getRooms()
        let oldrooms = this.rooms.values()

        for (const oldroom of oldrooms ) {
            if( ! newrooms.find( (newroom)=>{ newroom == oldroom.name} ) ){
                await this.closeRoom(oldroom)
                this.rooms.delete(oldroom.name) 
            }
        }

        for (const newroom of newrooms) {
            if( ! this.rooms.has(newroom.name) ){
                await this.openRoom(newroom)
            }
        }
        return this.rooms
    }

    async status(){
        let clients = Array.from(this.sockets.values()).map((socket)=>{
            let rooms = []
            for (const room in socket.rooms) {
                rooms.push(room)
            }
            return {
                name : socket.username,
                address : socket.conn.remoteAddress,
                loginDate : socket.handshake.time,
                id : socket.id,
                rooms: rooms,
                connected : socket.connected
            }
        })
        return { clients: clients, rooms: Array.from(this.rooms.values())}
    }

    // Calls onNewClient if login successful
    async onLogin (socket,data,replyFn){
        
        socket.auth = await this.db.verifyClient(data.username,data.password)
        if (socket.auth) {
            socket.username = data.username
            log.info(`${socket.id}(${socket.username}) login success`)
            // goes through the room list and sends client the assigned rooms
            for (const room of this.rooms.values()) {
                if( room.rcvName == socket.username  || room.fwdName == socket.username ){
                    await this.sendOpenRoom(socket,room)                                   
                }
            }
            replyFn('ack')
        }else{
            log.warn(`${socket.id} login ${data.username} failure`)
            replyFn('reject')
        }
    }

    async onLogout(socket,data,replyFn){
        socket.auth = false
        replyFn('ack')
    }

    // Called when new room opened and sends it to all clients registered with that room
    async openRoom(room){
        room.connections = new Map()
        this.rooms.set(room.name,room)
        this.sockets.forEach(async socket => {
                if (socket.username == room.rcvName || socket.username == room.fwdName){
                    await this.sendOpenRoom(socket,room)   
                }  
        });
    }

    // Called by onOpenRoom and onNewClient to send room info to client
    async sendOpenRoom(socket,room){
        return new Promise((resolve, reject) => {
            let json = new JSONData("server","onOpenRoom",{room:room})
            socket.join(room.name,(err)=>{
                if (err){
                    log.error(`${socket.id}(${socket.username}) failed to join ${room.name} room !`, err)
                    reject(`${socket.id}(${socket.username}) failed to join ${room.name} room !`)
                }else{
                    socket.emit("onOpenRoom",json,()=>{
                        if (socket.username == room.rcvName){
                            room.rcvId = socket.id
                        }
                        else {
                            room.fwdId = socket.id
                        }
                        log.info(`${socket.id}(${socket.username}) joined ${room.name} room !`) 
                        resolve(true)
                    })              
                }
            })              
        });

    }

    async closeRoom(room){
        let socketIds = room.name ? await this.getRoomMembers(room.name) : []
        for (const socketId of socketIds) {
            await new Promise((resolve, reject) => {
                let socket = this.sockets.get(socketId)
                let json = new JSONData("server","onCloseRoom",{room:room})
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