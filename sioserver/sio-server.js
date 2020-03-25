const socketio = require('socket.io')
const path = require('path')
const express = require('express')
const HTTPServer = require("../lib/httpserver.js")
const mongooseclient = require("../lib/mongooseclient.js")
const JSONData = require('../lib/jsondata.js')
var log = require("ucipass-logger")("sio-server")
log.transports.console.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info"
const PORT = process.env.SIO_PORT ? process.env.SIO_PORT : "8081"
const PREFIX = process.env.PREFIX ? process.env.PREFIX : "/" 
console.log("PORT",PORT)
console.log("PREFIX",PREFIX)
class SIO  {
    constructor() {
        this.httpserver = null
        this.port = PORT
        this.app = null
        this.prefix = PREFIX
        this.sio_path = path.posix.join("/", this.prefix, "socket.io")
        this.sio_opts = { path: this.sio_path }
        this.sockets = new Map()
        this.rooms = new Map()
        this.users = new Map()
        this.latency = 0
        this.log = log;
        this.io = null
        this.events = null
        this.db = null
    }

    onConnection(socket){
        let address = socket.handshake.address;
        let socketId = socket.id
        this.sockets.set(socketId,socket)
        // socket.auth = true //temporary allowed
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

        socket.on('logout', (data,replyFn) => { 
            if(socket.auth) this.onLogout.call(this,socket,data,replyFn)
            else log.error(`${socketId}(${socket.username}) client intiated unauthenticated logout`);
        })

        socket.on('onTcpConnRequest', (data,replyFn) => { 
            if(socket.auth) this.onTcpConnRequest.call(this,socket,data,replyFn)
            else log.error(`${socketId}(${socket.username}) client intiated unauthenticated onTcpConnRequest`);
        })

        socket.on('onTcpConnClose', (data,replyFn) => { 
            if(socket.auth) this.onTcpConnClose.call(this,socket,data,replyFn) 
            else log.error(`${socketId}(${socket.username}) client intiated unauthenticated onTcpConnClose`);
        })

        socket.on('onData', (data,replyFn) => { 
            if(socket.auth) this.onData.call(this,socket,data,replyFn) 
            else log.error(`${socketId}(${socket.username}) client intiated unauthenticated onData`);
        })

        socket.on('onSendPrivateMsg', (data,replyFn) => { 
            if(socket.auth) this.onSendPrivateMsg.call(this,socket,data,replyFn) 
            else log.error(`${socketId}(${socket.username}) client intiated unauthenticated onSendPrivateMsg`);
        });

    }
    
    async start(){
        this.app = await this.httpcontrol()
        this.httpserver = new HTTPServer( { port:this.port, app:this.app})
        let server = await this.httpserver.start()
        this.io = socketio( server, this.sio_opts)
        log.info("Listening path:", this.sio_path.toString() )

        this.db = await mongooseclient()
        .catch((error)=>{
            log.error("Database connection failure, exiting...")
            log.error(error)
            process.exit()
        })
        await this.refresh() // Load rooms from database
        this.io.on('connection', this.onConnection.bind(this))
        return this; 

    }
    
    async stop(){
        log.debug("Before DB Server close")
        await this.db.close()        
        let sockets = Array.from(this.sockets.values())
        for (const socket of sockets) {
            log.debug("Force Close Starting of Socket:",socket.id)
            socket.disconnect()
        }

        log.debug("Before Socket.io close number of connected sockets:",this.io.sockets.connected.length ? this.io.sockets.connected.length : 0)
        await new Promise((resolve, reject) => {
            this.io.close(()=>{
                log.info("Socket.io close complete")
                resolve(true)
            })
        })
        log.debug("Before HTTP Server close")
        await this.httpserver.stop().catch( err => {
            log.error(err)
        })
        return true
    }

    async httpcontrol(){
        const app = express()
        // app.use((req, res, next) => {
        //     console.log('Time:', Date.now(),req.path)
        //     next()
        //   }) 
        const url_status  = path.posix.join("/",PREFIX,"/status") 
        const url_refresh = path.posix.join("/",PREFIX,"/refresh")     
        app.get( url_status , async (req, res) => {
            res.json(await this.status())
          })
        app.get( url_refresh, async (req, res) => {
            await this.refresh()
            res.json(await this.status())
        })
        app.all( path.posix.join("/*",PREFIX) , async (req, res) => {
            res.json("sio")
        })
          
        return app
    }

    async refresh(){
        let newrooms = Array.from (await this.db.getRooms())
        let oldrooms = Array.from (this.rooms.values()) //this.rooms.values()
        let clients = await this.db.getClients()

        for (const oldroom of oldrooms ) {
            let match = newrooms.find( (newroom)=>  {
                let result =                     
                newroom.name       == oldroom.name  &&
                newroom.fwdName    == oldroom.fwdName  &&
                newroom.rcvName    == oldroom.rcvName  &&
                newroom.fwdPort    == oldroom.fwdPort  &&
                newroom.rcvPort    == oldroom.rcvPort  
                return (result)
                    
            })
            if( ! match ){
                await this.closeRoom(oldroom)
                await this.rooms.delete(oldroom.name) 
            }
        }

        for (const newroom of newrooms) {
            if( ! this.rooms.has(newroom.name) ){
                await this.openRoom(newroom)
            }
        }

        for (const socket of this.sockets.values()) {
            let valid = false;
            for (const client of clients ) {            
                if (socket.username == client.name){
                    valid = true
                }
            }
            if (!valid){
                log.info(`${socket.id}(${socket.username}) disconnecting invalid client`)
                socket.disconnect()
            }    


        }        

        return this.rooms
    }

    async status(){
        let clients_authenticated = 0
        let clients = Array.from(this.sockets.values()).map((socket)=>{
            let rooms = []
            for (const room in socket.rooms) {
                rooms.push(room)
            }
            if (socket.auth) clients_authenticated++
            return {
                name : socket.username,
                address : socket.conn.remoteAddress,
                loginDate : socket.handshake.time,
                id : socket.id,
                rooms: rooms,
                connected : socket.connected,
                auth : socket.auth
            }
        })
        return { clients: clients, rooms: Array.from(this.rooms.values()), clients_authenticated: clients_authenticated}
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
            // starts proxy server if allowed
            let client = await this.db.getClient(data.username)
            if ( parseFloat(client.proxyport) > 0 ){
                await this.sendStartProxy(socket,client.proxyport)
            }
            replyFn('ack')
        }else{
            log.warn(`${socket.id} login ${data.username} failure`)
            replyFn('reject')
            socket.disconnect()
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
        let sockets = this.sockets.values()
        for (const socket of sockets) {
            if (socket.username == room.rcvName || socket.username == room.fwdName){
                await this.sendOpenRoom(socket,room)   
            }          
        }
        return true
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

    async sendStartProxy(socket,proxyport){
        return new Promise((resolve, reject) => {
            let json = new JSONData("server","onStartProxy",{proxyport:proxyport})
            socket.emit("onStartProxy",json,(result)=>{
                if (result){
                    log.info(`${socket.id}(${socket.username}) started proxy in port ${proxyport}!`) 
                    resolve(result)
                }
                else {
                    log.error(`${socket.id}(${socket.username}) failed proxy in port ${proxyport}!`) 
                    resolve(result)
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
                    log.info(`${room} room leaves: ${socketId}`)
                    resolve(socketId)                   
                }
            })            
        });
    }

}

module.exports = SIO

if (require.main === module) {
    let sio = new SIO()
    sio.start()
}