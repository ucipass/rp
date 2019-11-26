const expect = require('expect');
const fs = require('fs');
const TestServer = require("./testserver.js")
const Echoserver = require("./echoserver.js")
const Echoclient = require("./echoclient.js")
const File = require("ucipass-file")

const Client = require("../client.js")
const SIO = require("../sio-server.js")
const SIOClient = require("../sio-client.js")
const delay = require("../delay.js")
var log = require("ucipass-logger")("mocha")
log.transports.console.level = 'debug'
log.transports.file.level = 'error'



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

describe('\n\n=================== SOCKET.IO TESTS ========================', () => {

    it('Socket.io Basic Client Test', async () => {
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()

        let io = require('socket.io')(server);
        io.on('connection', function(socket){
          log.info('client connected');
        });

        let client = new SIOClient()
        await client.start("http://localhost:3000")
        await client.stop()

        await testServer.stop()
        delete testServer;
    });

    it('Socket.io Basic Server/Client Test', async () => {
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()


        let sio = new SIO()
        await sio.start(server)
        let client = new SIOClient()
        await client.start("http://localhost:3000")
        await client.stop()
        await sio.stop()

        await testServer.stop()
        delete testServer;
    });

    it('Socket.io Basic Server/Multi-Client Test', async () => {
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()

        let sio = new SIO()
        await sio.start(server)
        let client1 = new SIOClient()
        let client2 = new SIOClient()
        let client3 = new SIOClient()
        let client4 = new SIOClient()
        await client1.start("http://localhost:3000")
        await client2.start("http://localhost:3000")
        await client3.start("http://localhost:3000")
        await client4.start("http://localhost:3000")
        await client1.stop()
        await client2.stop()
        await client3.stop()
        await client4.stop()
        await sio.stop()

        await testServer.stop()
        delete testServer;
    });

    it('Socket.io Server Error Test', async () => {
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()

        let sio = new SIO()
        await sio.start(server)
        let client1 = new SIOClient()
        await client1.start("http://localhost:3000")
        await testServer.stop()
    });

    it('Socket.io echo Test', async () => {
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()

        let sio = new SIO()
        await sio.start(server)
        let client1 = new SIOClient()
        await client1.start("http://localhost:3000")
        let reply = await client1.emit("ping")
        await client1.stop()
        await sio.stop()
        await testServer.stop()
        expect(reply).toEqual("ack");
    });

    it('Socket.io Room Test', async () => {
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()

        let sio = new SIO()
        await sio.start(server)
        let client1 = new SIOClient()
        let client2 = new SIOClient()
        let client3 = new SIOClient()
        let client4 = new SIOClient()
        let socket1 = await client1.start("http://localhost:3000")
        let socket2 = await client2.start("http://localhost:3000")
        let socket3 = await client3.start("http://localhost:3000")
        let socket4 = await client4.start("http://localhost:3000")
        await sio.joinRoom("all",socket1.id)
        await sio.joinRoom("all",socket2.id)
        await sio.joinRoom("all",socket3.id)
        await sio.joinRoom("all",socket4.id)

        await client3.stop()
        await sio.leaveRoom("all",socket2.id)
        await client1.stop()
        await client2.stop()
        await client4.stop()
        let members = await sio.getRoomMembers('all')
        await sio.stop()
        await testServer.stop()
        expect(members.length).toEqual(3);
    });

    it('Socket.io Send to ALL Room Test', async () => {
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()

        let sio = new SIO()
        await sio.start(server)
        let client1 = new SIOClient()
        let client2 = new SIOClient()
        let client3 = new SIOClient()
        let client4 = new SIOClient()
        let socket1 = await client1.start("http://localhost:3000")
        let socket2 = await client2.start("http://localhost:3000")
        let socket3 = await client3.start("http://localhost:3000")
        let socket4 = await client4.start("http://localhost:3000")
        await sio.joinRoom("all1",socket1.id)
        await sio.joinRoom("all2",socket2.id)
        await sio.joinRoom("all1",socket3.id)
        await sio.joinRoom("all2",socket4.id)
        await client1.emit("test1")
        await client2.emit("test2")
        await client1.stop()
        await client2.stop()
        await client3.stop()
        await client4.stop()
        await sio.stop()
        await testServer.stop()
        expect(4).toEqual(4);
    });

    it.only('Socket.io Authentication', async () => {
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()

        let sio = new SIO()
        await sio.start(server)
        let client1 = new SIOClient()
        let client2 = new SIOClient()
        let clientSock1 = await client1.start("http://localhost:3000")
        let clientSock2 = await client2.start("http://localhost:3000")
        let clientSockId1 = clientSock1.id
        let clientSockId2 = clientSock2.id
        let serverSock1 = sio.getSocketById(clientSockId1)
        let serverSock2 = sio.getSocketById(clientSockId2)
        let serverSockId1 = serverSock1.id
        let serverSockId2 = serverSock2.id
        expect(serverSockId1).toEqual(clientSockId1);
        expect(serverSockId2).toEqual(clientSockId2)
        let clientauth1 = await client1.login({username:'test',password:'test'})
        let clientauth2 = await client2.login({username:'test',password:'test2'})
        expect(clientauth1).toEqual('ack');
        expect(clientauth2).not.toEqual('ack')
        expect(serverSock1.auth).toEqual(true);
        expect(serverSock2.auth).toEqual(false)
        await client1.logout()
        expect(serverSock1.auth).toEqual(false)
        
        await client1.stop()
        await client2.stop()
        await sio.stop()
        await testServer.stop()
    });

    it.only('Socket.io Authentication', async () => {
        let app = require('express')();
        let testServer = new TestServer(app,3000)
        let server = await testServer.start()
        let file1 = new File("iperf.bin")
        await file1.read()


        let sio = new SIO()
        await sio.start(server)
        let client1 = new SIOClient()
        let client2 = new SIOClient()
        let clientSock1 = await client1.start("http://localhost:3000")
        let clientSock2 = await client2.start("http://localhost:3000")
        sio.joinRoom("all",clientSock1.id)
        sio.joinRoom("all",clientSock2.id)
        await client1.emit(file1.buffer)
        await delay(5000)

        await client1.stop()
        await client2.stop()
        await sio.stop()
        await testServer.stop()
    });

  });