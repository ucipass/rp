const expect = require('expect');
const fs = require('fs');
const config = require('config');
const TestServer = require("./testserver.js")
const Echoserver = require("./echoserver.js")
const Echoclient = require("./echoclient.js")
const File = require("ucipass-file")
const JSONData = require('../jsondata.js')
const Client = require("../client.js")
const SIO = require("../sio-server.js")
const SIOClient = require("../sio-client.js")
const delay = require("../delay.js")
var log = require("ucipass-logger")("mocha")
log.transports.console.level = 'debug'
log.transports.file.level = 'error'

const logg = require('why-is-node-running')
const userDB = config.get("userDB")
const roomDB = config.get("roomDB")



describe('\n\n=================== APP TESTS ========================', () => {
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

describe.only('\n\n=================== SOCKET.IO TESTS ========================', () => {

    it('Socket.io Client Only Connect Test', async () => {
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()
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
        await testServer.stop()
    });

    it('Socket.io Server/Clients Connect Test', async () => {
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()

        let sio = new SIO(server)
        let client1 = new SIOClient()
        let client2 = new SIOClient()
        let client3 = new SIOClient()
        let clientSocket1 = await client1.start("http://localhost:3000")
        let clientSocket2 = await client2.start("http://localhost:3000")
        let clientSocket3 = await client3.start("http://localhost:3000")
        let serverSockets = new Set(sio.getSocketIds())
        expect( serverSockets.size ).toEqual(3);
        expect( serverSockets.has(clientSocket1.id) ).toEqual(true);
        expect( serverSockets.has(clientSocket2.id) ).toEqual(true);
        expect( serverSockets.has(clientSocket3.id) ).toEqual(true);
        await client1.stop()
        await client2.stop()
        await client3.stop()
        await sio.stop()
        await testServer.stop()
    });

    it('Socket.io Client/Server Ping Test', async () => {
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()

        let sio = new SIO(server)
        let client1 = new SIOClient()
        await client1.start("http://localhost:3000")
        let json1 = new JSONData("client1", "ping","ping")
        json1 = await client1.emit(json1)
        await client1.stop()
        await sio.stop()
        await testServer.stop()
        expect(json1.type).toEqual("pong");
    });

    it('Socket.io Authentication', async () => {
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()

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
        
        await client1.stop()
        await client2.stop()
        await sio.stop()
        await testServer.stop()
    });
    
    it('Socket.io Room Join/Leave Test', async () => {
        debugLevelServer = 'error'
        debugLevelClient = 'error'
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()
        let sio = new SIO(server)
        sio.log.transports.console.level = debugLevelServer
        sio.loadRoomDB(roomDB)
        sio.loadUserDB(userDB)
        let client1 = new SIOClient("http://localhost:3000","client1","client1")
        client1.log.transports.console.level = debugLevelClient
        let client2 = new SIOClient("http://localhost:3000","client2","client2")
        let client3 = new SIOClient("http://localhost:3000","client3","client3")
        let client4 = new SIOClient("http://localhost:3000","client4","client4")
        let socket1 = await client1.start()
        let socket2 = await client2.start()
        let socket3 = await client3.start()
        let socket4 = await client4.start()
        await sio.joinRoom("room1",socket1.id)
        await sio.joinRoom("room1",socket2.id)
        await sio.joinRoom("room2",socket3.id)
        await sio.joinRoom("room2",socket4.id)
        expect((await sio.getRoomMembers('room1')).length).toEqual(2);
        expect((await sio.getRoomMembers('room2')).length).toEqual(2);
        await sio.leaveRoom("room1",socket1.id)
        await sio.leaveRoom("room2",socket3.id)
        expect((await sio.getRoomMembers('room1')).length).toEqual(1);
        expect((await sio.getRoomMembers('room2')).length).toEqual(1);
        await client1.stop()
        await client2.stop()
        await client3.stop()
        await client4.stop()
        expect((await sio.getRoomMembers('room1')).length).toEqual(0);
        expect((await sio.getRoomMembers('room2')).length).toEqual(0);
        await sio.stop()
        await testServer.stop()
    });

    it('Socket.io Private Room Test', async () => {
        debugLevelServer = 'error'
        debugLevelClient = 'error'
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()

        let sio = new SIO(server)
        sio.log.transports.console.level = debugLevelServer
        sio.loadRoomDB(roomDB)
        sio.loadUserDB(userDB)
        let client1 = new SIOClient("http://localhost:3000","client1","client1")
        let client2 = new SIOClient("http://localhost:3000","client2","client2")
        client1.log.transports.console.level = debugLevelClient
        let socket1 = await client1.start()
        let socket2 = await client2.start()
        await sio.joinRoom("room1",socket1.id)
        await sio.joinRoom("room1",socket2.id)
        let json = new JSONData("client1","onSendPrivateMsg",{room:"room1",msg:"test1"})
        let jsonReply = await client1.emit(json)
        expect(jsonReply.att.msg).toEqual("ack");
        await client1.stop()
        await client2.stop()
        await sio.stop()
        await testServer.stop()
    });

    it('Socket.io Room Join/Leave Test', async () => {
        debugLevelServer = 'error'
        debugLevelClient = 'error'
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()
        let sio = new SIO(server)
        sio.log.transports.console.level = debugLevelServer
        sio.loadRoomDB(roomDB)
        sio.loadUserDB(userDB)
        let client1 = new SIOClient("http://localhost:3000","client1","client1")
        client1.log.transports.console.level = debugLevelClient
        let client2 = new SIOClient("http://localhost:3000","client2","client2")
        let client3 = new SIOClient("http://localhost:3000","client3","client3")
        let client4 = new SIOClient("http://localhost:3000","client4","client4")
        let socket1 = await client1.start()
        let socket2 = await client2.start()
        let socket3 = await client3.start()
        let socket4 = await client4.start()
        await sio.joinRoom("room1",socket1.id)
        await sio.joinRoom("room1",socket2.id)
        await sio.joinRoom("room2",socket3.id)
        await sio.joinRoom("room2",socket4.id)
        expect((await sio.getRoomMembers('room1')).length).toEqual(2);
        expect((await sio.getRoomMembers('room2')).length).toEqual(2);
        await sio.leaveRoom("room1",socket1.id)
        await sio.leaveRoom("room2",socket3.id)
        expect((await sio.getRoomMembers('room1')).length).toEqual(1);
        expect((await sio.getRoomMembers('room2')).length).toEqual(1);
        await client1.stop()
        await client2.stop()
        await client3.stop()
        await client4.stop()
        expect((await sio.getRoomMembers('room1')).length).toEqual(0);
        expect((await sio.getRoomMembers('room2')).length).toEqual(0);
        await sio.stop()
        await testServer.stop()
    });

    it('Socket.io EchoClient', async () => {
        debugLevelServer = 'info'
        debugLevelClient = 'info'
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()
        let sio = new SIO(server)

        sio.loadRoomDB(roomDB)
        sio.loadUserDB(userDB)
        let client1 = new SIOClient("http://localhost:3000","client1","client1")
        let client2 = new SIOClient("http://localhost:3000","client2","client2")
        client1.log.transports.console.level = debugLevelClient
        sio.log.transports.console.level = debugLevelServer
        let socket1 = await client1.start()
        let socket2 = await client2.start()
        await sio.joinRoom("room1",socket1.id)
        await sio.joinRoom("room1",socket2.id)

        let SERVER_PORT = 4002;
        let CLIENT_PORT = 4001;
        let echoserver = new Echoserver(SERVER_PORT)
        await echoserver.start()
        let echoclient1 = await new Echoclient(CLIENT_PORT);
        let reply = await echoclient1.send("ABCD")
        expect("ABCD").toEqual(reply);
        await echoserver.stop()
        await client1.stop()
        await client2.stop()
        await sio.stop()
        await testServer.stop()
    });

});

describe.skip('========================DUPLEX==================================', ()=>{
    it("test1",async ()=>{
        let stream = require('stream')
        class MyDuplex extends stream.Duplex {
            constructor(options){
                super(options)
            }

            _write(chunk,encoding,cb){
                console.log("data written to stream",chunk.toString())
                cb()
            }

            _read(size){
                setTimeout(() => {
                    let date = (new Date()).toString()
                    this.push(data)
                }, 1000);

            }
        }

        let ws = new MyDuplex()

        setInterval(() => {
            ws.write((new Date().toString()))
        }, 1000);

        ws.on('data',(data)=>{
            console.log("data read from stream",data.toString())
        })




    })
})