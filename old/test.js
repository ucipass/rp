const expect = require('expect');
const fs = require('fs');
const config = require('config');
const logg = require('why-is-node-running')
const File = require("ucipass-file")
const JSONData = require('../jsondata.js')
const Client = require("./client.js/index.js")
const SIO = require("../sio-server.js")
const SIOClient = require("../sio-client.js")
const delay = require("./delay.js")
var log = require("ucipass-logger")("mocha")
const TestServer = require("./testserver.js")
const Echoserver = require("./echoserver.js")
const Echoclient = require("./echoclient.js")






describe.skip('\n\n=================== APP TESTS ========================', () => {
    it('Echo Server Test', async () => {

        let SERVER_PORT = 3333;
        let echoserver = new Echoserver(SERVER_PORT) 
        let echoclient1 = new Echoclient(SERVER_PORT);
        let echoclient2 = new Echoclient(SERVER_PORT);
        await echoserver.start()
        let r1 =  await echoclient1.send("ABCD")
        let r2 =  await echoclient2.send("EFGH")
        await echoserver.stop()
        expect(r1).toEqual("ABCD");
        expect(r2).toEqual("EFGH");

    });

    it('Basic Test1', async () => {
        let CLIENT_PORT = 3331
        let SERVER_PORT = 4441
        let SERVER_ADDR = "localhost"
        let oldroom = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        let newroom = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        newroom.members[0].listener.srcPort = CLIENT_PORT
        newroom.members[1].forwarder.dstPort = SERVER_PORT
        newroom.members[1].forwarder.dstIP = SERVER_ADDR
        fs.writeFileSync("config.json", JSON.stringify(newroom,null,2), 'utf8')
        
        let client1 = new Client("client1");
        let client2 = new Client("client2");

        const server = require("../server.js")
        await server.started;
        await client1.start()
        await client2.start()
        let echoserver = new Echoserver(SERVER_PORT)    
        await echoserver.start()
        
        let echoclient1 = new Echoclient(CLIENT_PORT);
        let echoclient2 = new Echoclient(CLIENT_PORT);
        let reply1 =  await echoclient1.send("ABCD")
        let reply2 =  await echoclient2.send("EFGH")
        
        await echoserver.stop()
        await client1.stop();
        await client2.stop();
        await server.stop();
        fs.writeFileSync("config.json", JSON.stringify(oldroom,null,2), 'utf8')
        expect(reply1).toEqual("ABCD");
        expect(reply2).toEqual("EFGH");
    });

});

describe('\n\n=================== SOCKET.IO TESTS ========================', () => {
    
    let server = null;

    beforeEach("Before", async()=>{
        let app = require('express')();
        this.testServer = new TestServer(app,3000)
        server = await this.testServer.start()
    })

    afterEach("After",  async()=>{
        await this.testServer.stop()
    })

    it('Socket.io Client Only Connect Test', async () => {
        let serverSocketID = null
        let io = require('socket.io')(server);
        io.on('connection', function(socket){
            serverSocket = socket
            serverSocketID = socket.id
            // socket.on('close', (data,replyFn)=>{
            //     replyFn('ack')
            //     socket.disconnect()
            // })            
        });

        let client = new SIOClient("http://localhost:3000")
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
        let clientSocket1 = await client1.start("http://localhost:3000")
        let clientSocket2 = await client2.start("http://localhost:3000")
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
        let clientSock1 = await client1.start("http://localhost:3000")
        let clientSock2 = await client2.start("http://localhost:3000")
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
        let client1 = new SIOClient("http://localhost:3000","client1","client1")
        let client2 = new SIOClient("http://localhost:3000","client2","client2")
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
        let client1 = new SIOClient("http://localhost:3000","client1","client1")
        let client2 = new SIOClient("http://localhost:3000","client2","client2")
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
        let client1 = new SIOClient("http://localhost:3000","client1","client1")
        let client2 = new SIOClient("http://localhost:3000","client2","client2")
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

describe('\n\n=================== APP & SOCKET.IO TESTS ========================', () => {
    
    beforeEach("Before", async ()=>{
        let app = require("../sio-app.js")
        this.testServer = new TestServer(app,3000)
        this.server = await this.testServer.start()

    })

    afterEach("After",  async ()=>{
        await this.testServer.stop()
    })

    it.skip("Test1", async ()=>{
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
            "name": "ee",
            "rcvName": "client1",
            "rcvPort": "2001",
            "fwdName": "client2",
            "fwdHost": "localhost",
            "fwdPort": "22"
        }
        let sio = new SIO(this.server)
        // deleting all existing rooms
        for (const room of sio.rooms.values()) {
            sio.rooms.delete(room.name)
        }

        const superagent = require('superagent');
        await superagent.post('http://localhost:3000/create').send(room1)
        await superagent.post('http://localhost:3000/create').send(room2)
        let client1 = new SIOClient(null,"client1","client1")
        let client2 = new SIOClient(null,"client2","client2")
        await client1.start()
        await client2.start()
        await superagent.post('http://localhost:3000/delete').send(room1)
        await superagent.post('http://localhost:3000/delete').send(room2)
        await superagent.post('http://localhost:3000/create').send(room3)
        await new Promise((resolve, reject) => {
            
        });
        await client1.stop()
        await sio.stop()

    })

})