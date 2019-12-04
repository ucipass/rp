const socketio = require('socket.io')
const config = require('config');
const JSONData = require('./jsondata.js')
var log = require("ucipass-logger")("sio-server")
log.transports.console.level = 'info'
log.transports.file.level = 'error'

class SIO  {
    constructor(server) {
        this.sockets = new Map()
        this.rooms = new Map()
        this.users = new Map()
        this.connections = new Map()
        this.latency = 0
        this.log = log;
        this.io = socketio(server)
        this.io.on('connection', this.onConnection.bind(this))
        this.loadUserDB( config.get("userDB") )
        this.loadRoomDB( config.get("roomDB") )
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
        log.info(`${socketId} connected`);

        socket.on('disconnect', (data)=>{
            log.info(`${socketId}(${socket.username}) disconnect event`);
            this.sockets.delete(socketId)
        })

        socket.on('close', (data,replyFn)=>{
            replyFn('ack')
            socket.disconnect()
            // this.sockets.delete(socketId)
            log.info(`${socketId}(${socket.username}) client intiated close completed`);
        })

        socket.on('login', (data,replyFn)  => { this.onLogin.call(this,socket,data,replyFn ) })

        socket.on('logout', (data,replyFn) => { this.onLogout.call(this,socket,data,replyFn) })

        socket.on('onTcpConnRequest', (data,replyFn) => { this.onTcpConnRequest.call(this,socket,data,replyFn) })

        socket.on('onTcpConnClose', (data,replyFn) => { this.onTcpConnClose.call(this,socket,data,replyFn) })

        socket.on('onData', (data,replyFn) => { this.onData.call(this,socket,data,replyFn) })

        socket.on('json', async (data,replyFn) =>{
            if (! socket.auth){
                log.error(`${socket.id}(${socket.username}) is not authenticated, invalid data`)
                return replyFn('authentication denied')
            }else{
                log.debug(`${socket.id}(${socket.username}) data received`)
            }

            let json = new JSONData()
            let reply = null
            try {
                json.setjson(data)

            } catch (error) {
                let msg = error.toString()
                log.error(`${socket.id}(${socket.username}) JSON received is invalid`)
                return replyFn(msg)
                
            }   
            try {
                let reply = await this.onJson.call(this,socket,json)
                return replyFn(reply.json)                
            } catch (error) {
                let msg = error.toString()
                log.error(`${socket.id}(${socket.username}) JSON reply is invalid`)
                return replyFn(msg)                
            }

            

        });

        socket.on('data2', async (json) =>{
            if (! socket.auth){
                log.error(`${socket.id}(${socket.username}) is not authenticated, invalid data`)
            }else{
                log.debug(`${socket.id}(${socket.username}) data received: ${json.data.att.data}`)
                this.onData.call(this,socket,json)
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
            log.info(`${socket.id}(${socket.username}) login success`)
            replyFn('ack')
            this.sendClientConfig.call(this,socket)            
            this.rooms.forEach((room)=>{
                if( room.rcvName == socket.username  || room.fwdName == socket.username ){
                    log.info(`${socket.id}(${socket.username}) joining ${room.name} room !`)  
                    socket.join(room.name,(err)=>{
                        if (err) log.error(`${socket.id}(${socket.username}) failed to join ${room.name} room !`, err)
                    })                         
                }
            })
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
        else if ( json.type == "onTcpConnRequest") { return await this.onTcpConnRequest.call(this,socket,json) }
        else if ( json.type == "onSendRoomMsg") { return await this.onSendRoomMsg.call(this,socket,json) }
        else if ( json.type == "onSendPrivateMsg") { return await this.onSendPrivateMsg.call(this,socket,json) }
        else{
            json.type = json.type + "-reply"
            json.err = "nomatch"
            return json
        }

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

    async onPing(socket, json){
        json.type = "pong"
        return json
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
        room.connections.delete(json.att.connectionId)
        socket.to(json.att.room).emit("onTcpConnClose",json)
        json.id = "server"
        json.att.msg = 'ack'
        replyFn(json)
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
            log.debug(`forwarding message ${socket.id}(${socket.username}) -> ${otherSocket.id}(${otherSocket.username})`)
            let waitForReply = await new Promise((resolve, reject) => {
                otherSocket.emit("json",json.json,(replyData)=>{
                    let replyJson = new JSONData()
                    replyJson = replyJson.setjson(replyData)
                    log.debug(`forwarding acknowledgement ${otherSocket.id}(${otherSocket.username}) -> ${socket.id}(${socket.username})`)
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

    async sendClientConfig(socket){
        let noRoomsFound = true
        let json = new JSONData("server","onClientConfig",{})
        this.rooms.forEach(room => {
            if (room.rcvName == socket.username || room.fwdName == socket.username){
                log.debug(`${socket.id}(${socket.username}) sending room configuration: ${room.name}`)
                noRoomsFound = false
                json.att.room = room
                socket.emit("json",json.json)
            }
        });

        if ( noRoomsFound ) {
            log.info(`${socket.id}(${socket.username}) no room configuration found`)
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

if (require.main === module) {
    var argv = require('minimist')(process.argv.slice(2));
    if ( argv.p){
        const express = require('express')
        const app = express()
        const port = argv.p
        app.get('/', "0.0.0.0", (req, res) => res.send('Hello World!'))       
        let server = app.listen(port, () => console.log(`Socket.io standalone mode listening on port ${port}!`))
        let sio = new SIO(server)
    }else{
        console.log( "need -p for tcp port")
    }
}