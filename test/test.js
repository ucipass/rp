//############ PRODUCTION #######################
const SIO = require("../sio-server.js")
const SIOClient = require("../sio-client.js")
const JSONData = require('../jsondata.js')

//############  TESTING   ####################
const TestServer = require("./testserver.js")
const Echoserver = require("./echoserver.js")
const Echoclient = require("./echoclient.js")
const delay = require("./delay.js")

const expect = require('expect');
const path = require('path')
// const fs = require('fs');
// const config = require('config');
// const logg = require('why-is-node-running')
// const File = require("ucipass-file")
const log = require("ucipass-logger")("mocha")

//########### Constants ######################
const port   = process.env.VUE_APP_SERVER_PORT
const prefix = process.env.VUE_APP_PREFIX
const url = new URL("http://localhost:"+ port +"/"+ prefix + "/")
const sio_path = path.posix.join(url.pathname,"socket.io")

describe('\n\n=================== SOCKET.IO TESTS ========================', () => {
    
    let server = null;

    beforeEach("Before", async()=>{
        let app = require('express')();
        this.testServer = new TestServer(app,port)
        server = await this.testServer.start()
    })

    afterEach("After",  async()=>{
        await this.testServer.stop()
    })

    it('Socket.io Client Only Connect Test', async () => {
        let serverSocketID = null
        let io = require('socket.io')(server,{path:sio_path});
        io.on('connection', function(socket){
            serverSocket = socket
            serverSocketID = socket.id
            // socket.on('close', (data,replyFn)=>{
            //     replyFn('ack')
            //     socket.disconnect()
            // })            
        });

        let client = new SIOClient()
        clientSocket = await client.start()
        let clientSocketId = clientSocket.id
        expect(clientSocketId).toEqual(serverSocketID)
        client.stopped = true
        clientSocket.disconnect()
    });

    it('Socket.io Server/Clients Connect Test', async () => {
        let sio = new SIO(server)
        let client1 = new SIOClient()
        let client2 = new SIOClient()
        let clientSocket1 = await client1.start()
        let clientSocket2 = await client2.start()
        expect( sio.sockets.size ).toEqual(2);
        await client1.stop()
        await client2.stop()
        expect( sio.sockets.size ).toEqual(0);
        await sio.stop()
    });

    it('Socket.io Authentication', async () => {
        let sio = new SIO(server)
        let client1 = new SIOClient()
        let client2 = new SIOClient()
        let clientSock1 = await client1.start()
        let clientSock2 = await client2.start()
        let clientauth1 = await client1.login("client1","client1")
        let clientauth2 = await client2.login("client2","client2")
        expect(clientauth1).toEqual('ack');
        expect(clientauth2).toEqual('ack')
        expect(sio.getSocketById(clientSock1.id).auth).toEqual(true);
        expect(sio.getSocketById(clientSock1.id).auth).toEqual(true);
        await client1.logout()
        expect(sio.getSocketById(clientSock1.id).auth).toEqual(false);
        await client2.logout()
        await client1.stop()
        await client2.stop()
        await sio.stop()
    });
    
    it('Socket.io Room Join/Leave Test', async () => {
        let sio = new SIO(server)
        let room1 = {
            "name": "room1",
            "rcvName": "client1",
            "rcvPort": "4001",
            "fwdName": "client2",
            "fwdHost": "localhost",
            "fwdPort": "22"
        }
        let room2 = {
            "name": "room2",
            "rcvName": "client1",
            "rcvPort": "4003",
            "fwdName": "client2",
            "fwdHost": "localhost",
            "fwdPort": "23"
        }
        sio.rooms.set(room1.name,room1)
        sio.rooms.set(room2.name,room2)
        let client1 = new SIOClient("client1","client1")
        let client2 = new SIOClient("client2","client2")
        let socket1 = await client1.start()
        let socket2 = await client2.start()
        expect((await sio.getRoomMembers('room1')).length).toEqual(2);
        await sio.leaveRoom("room1",socket1.id)
        expect((await sio.getRoomMembers('room1')).length).toEqual(1);
        await client1.stop()
        await client2.stop()
        expect((await sio.getRoomMembers('room1')).length).toEqual(0);
        await sio.stop()
    });

    it('Socket.io Private Room Test', async () => {
        let sio = new SIO(server)
        let room1 = {
            "name": "room1",
            "rcvName": "client1",
            "rcvPort": "4001",
            "fwdName": "client2",
            "fwdHost": "localhost",
            "fwdPort": "22"
        }
        sio.rooms.set(room1.name,room1)
        let client1 = new SIOClient("client1","client1")
        let client2 = new SIOClient("client2","client2")
        let socket1 = await client1.start()
        let socket2 = await client2.start()
        let json = new JSONData("client1","onSendPrivateMsg",{room:"room1",msg:"test1"})
        let jsonReply = await client1.emit(json)
        expect(jsonReply.att.msg).toEqual("ack");
        await client1.stop()
        await client2.stop()
        await sio.stop()
    });

    it('Socket.io EchoClient', async () => {
        let sio = new SIO(server)
        let SERVER_PORT = 4002;
        let CLIENT_PORT = 4001;
        let room1 = {
            "name": "room1",
            "rcvName": "client1",
            "rcvPort": CLIENT_PORT.toString(),
            "fwdName": "client2",
            "fwdHost": "localhost",
            "fwdPort": SERVER_PORT.toString(),
            connections: new Map()
        }
        sio.rooms.set(room1.name,room1)
        let client1 = new SIOClient("client1","client1")
        let client2 = new SIOClient("client2","client2")
        let socket1 = await client1.start()
        let socket2 = await client2.start()


        let echoserver = new Echoserver(SERVER_PORT)
        await echoserver.start()
        let echoclient1 = await new Echoclient(CLIENT_PORT);
        let reply1 = await echoclient1.send("ABCD")
        expect("ABCD").toEqual(reply1);

        await echoserver.stop()
        await client1.stop()
        await client2.stop()
        await sio.stop()
    });

});

describe('\n\n=================== SOCKET.IO & APP TESTS ========================', () => {
    
    beforeEach("Before", async ()=>{
        let app = require("../sio-app.js")
        this.testServer = new TestServer(app,port)
        this.server = await this.testServer.start()

    })

    afterEach("After",  async ()=>{
        await this.testServer.stop()
    })

    it("Complete Test", async ()=>{
        let room1 = {
            "name": "room1",
            "rcvName": "client1",
            "rcvPort": "4001",
            "fwdName": "client2",
            "fwdHost": "localhost",
            "fwdPort": "22"
        }
        let room2 = {
            "name": "room2",
            "rcvName": "client1",
            "rcvPort": "4003",
            "fwdName": "client2",
            "fwdHost": "localhost",
            "fwdPort": "23"
        }
        let room3 = {
            "name": "room3",
            "rcvName": "client1",
            "rcvPort": "5001",
            "fwdName": "client2",
            "fwdHost": "localhost",
            "fwdPort": "5002"
        }
        let sio = new SIO(this.server)
        // deleting all existing rooms
        for (const room of sio.rooms.values()) {
            sio.rooms.delete(room.name)
        }

        const superagent = require('superagent');
        await superagent.post( url.href + 'create').send(room1)
        await superagent.post( url.href + 'create' ).send(room2)
        let client1 = new SIOClient("client1","client1")
        let client2 = new SIOClient("client2","client2")
        await client1.start()
        await client2.start()
        await superagent.post( url.href + 'delete').send(room1)
        await superagent.post( url.href + 'delete').send(room2)
        await superagent.post( url.href + 'create').send(room3)
        await client1.stop()
        await sio.stop()
    })

})