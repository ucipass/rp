"use strict";
require('events').EventEmitter.defaultMaxListeners = 35;
//############ PRODUCTION #######################
const socketio = require('socket.io')
const SIO = require("../sio-server.js")
const SIOClient = require("../sio-client.js")
const JSONData = require('../jsondata.js')
const mongoose = require('mongoose')

//############  TESTING   ####################
const TestServer = require("./testserver.js")
const Echoserver = require("./echoserver.js")
const Echoclient = require("./echoclient.js")
const delay = require("./delay.js")
const superagent = require('superagent');

const expect = require('expect');
const path = require('path')
// const logg = require('why-is-node-running')
// const File = require("ucipass-file")
// const log = require("ucipass-logger")("mocha")

//########### Constants ######################
const prefix = process.env.VUE_APP_PREFIX ? process.env.VUE_APP_PREFIX : ""
const URL_MGR = new URL("http://localhost/")
const PORT_MGR   = process.env.VUE_APP_SERVER_PORT ? process.env.VUE_APP_SERVER_PORT : "3111"
URL_MGR.pathname = prefix 
URL_MGR.port = PORT_MGR
const URL_MGR_LOGIN = URL_MGR.origin + path.posix.join("/",prefix,"login")
const URL_MGR_CREATE = URL_MGR.origin + path.posix.join("/",prefix,"create")
const URL_MGR_READ = URL_MGR.origin + path.posix.join("/",prefix,"read")
const URL_MGR_UPDATE = URL_MGR.origin + path.posix.join("/",prefix,"update")
const URL_MGR_DELETE = URL_MGR.origin + path.posix.join("/",prefix,"delete")

const URL_SIO = new URL("http://localhost/")
const PORT_SIO = process.env.PORT_MGR ? process.env.PORT_MGR : "3002"
URL_SIO.pathname = prefix 
URL_SIO.port = PORT_SIO

const sio_path = path.posix.join(URL_SIO.pathname,"socket.io")
let app = null //set later cause I don't want to kill the mongoose connection

describe('\n\n=================== MONGODB TESTS ========================', () => {
    
    beforeEach("Before", async ()=>{

    })

    afterEach("After",  async ()=>{

    })

    it("MongoDB Client Management", async ()=>{
        try{
            let db,client,clientObj,result
            db = require("../mongooseclient.js")()
            client = "testclient1123456"
            await db.deleteClient(client)
            await db.createClient(client)
            clientObj = await db.getClient(client)
            result = await db.verifyClient(clientObj.name,clientObj.token)
            expect(result).toEqual(true)     
            result = await db.verifyClient(clientObj.name,"123")
            expect(result).toEqual(false)     
            result = await db.verifyClient("123",clientObj.token)
            expect(result).toEqual(false) 
            await db.deleteClient(client)    
            
            await db.deleteWebuser("test1")   
            await db.createWebuser("test1","test2")                
            result = await db.getWebuser("test1")       
            expect(result.username).toEqual("test1") 
            await db.close()  
        } catch (error) {
            console.log(error)
        }
    })

    it("MongoDB Rooms Management", async ()=>{
        try{
            let db,result,room1,room2,roomNumber
            db = require("../mongooseclient.js")()
            room1 = {
                name: "testmocharoom1",
                rcvName: "testclient1",
                rcvPort: "2222",
                fwdName: "localhost",
                fwdHost: "testclient2",
                fwdPort: "3333"
            }
            room2 = {
                name: "testmocharoom2",
                rcvName: "testclient1",
                rcvPort: "2222",
                fwdName: "localhost",
                fwdHost: "testclient2",
                fwdPort: "3333",
                expiration: new Date()
            }

            result = await db.deleteRoom(room1)
            result = await db.deleteRoom(room2)
            roomNumber = (await db.getRooms()).length
            result = await db.createRoom(room1)
            result = await db.createRoom(room2)
            result = await db.getRooms()
            expect(result.length).toEqual(roomNumber+2)
            result = await db.getRoom(room1)
            expect(result.name).toEqual(room1.name) 
            result = await db.deleteRoom(room1)
            result = await db.getRooms()
            expect(result.length).toEqual(roomNumber+1) 
            result = await db.deleteRoom(room2)
            result = await db.getRooms()
            expect(result.length).toEqual(roomNumber) 
            await db.close()  
        } catch (error) {
            console.log(error)
        }
    })

})

describe.only('\n\n=================== SOCKET.IO TESTS ========================', () => {
    
    let server = null;

    before("Before", async()=>{
        this.db = require("../mongooseclient.js")()      
        await this.db.deleteClient("testsocketioclient1")
        await this.db.deleteClient("testsocketioclient2")
        this.clientObj1 = await this.db.createClient("testsocketioclient1")
        this.clientObj2 = await this.db.createClient("testsocketioclient2")    
    })

    beforeEach("Before", async()=>{
        let appalt = require('express')();
        this.testServer = new TestServer(appalt,PORT_SIO)
        server = await this.testServer.start()

    })

    afterEach("After",  async()=>{
        await this.testServer.stop()
    })

    after("Before", async()=>{
        await this.db.deleteClient(this.clientObj1.name)
        await this.db.deleteClient(this.clientObj2.name)
        await this.db.close()            
    })

    it('Socket.io Native Client Only Connect Test', async () => {
        let serverSocketID = null
        let io = require('socket.io')(server,{path:sio_path});
        io.on('connection', function(socket){
            serverSocketID = socket.id          
        });

        let client = new SIOClient(null,null,URL_SIO.href)
        let clientSocket = await client.start()
        let clientSocketId = clientSocket.id
        expect(clientSocketId).toEqual(serverSocketID)
        client.stopped = true
        clientSocket.disconnect()
    });

    it('Socket.io Authentication', async () => {

        let sio = await (new SIO(server)).start()
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,URL_SIO.href)
        let client2 = new SIOClient(this.clientObj2.name,"123",URL_SIO.href)
        let clientSock1 = await client1.start()
        let clientSock2 = await client2.start()
        expect(sio.getSocketById(clientSock1.id).auth).toEqual(true);
        expect(sio.getSocketById(clientSock2.id).auth).toEqual(false);
        await client1.stop()
        await client2.stop()
        await sio.stop()
    });

    it('Socket.io Server/Clients (re)Connect Test', async () => {
        let sio = await (new SIO(server)).start()
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,URL_SIO.href)
        let client2 = new SIOClient(this.clientObj1.name,this.clientObj1.token,URL_SIO.href)
        let clientSocket1 = await client1.start()
        let clientSocket2 = await client2.start()
        expect( sio.sockets.size ).toEqual(2);
        await client1.stop()
        await client2.stop()
        expect( sio.sockets.size ).toEqual(0);
        await sio.stop()
    });
    
    it('Socket.io Room Join/Leave Test', async () => {
        let sio = await (new SIO(server)).start()
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": this.clientObj1.name,
            "rcvPort": "44001",
            "fwdName": this.clientObj2.name,
            "fwdHost": "localhost",
            "fwdPort": "22"
        }
        let room2 = {
            "name": "testmocharoom2",
            "rcvName": this.clientObj1.name,
            "rcvPort": "44002",
            "fwdName": this.clientObj2.name,
            "fwdHost": "localhost",
            "fwdPort": "23"
        }
        sio.rooms.set(room1.name,room1)
        sio.rooms.set(room2.name,room2)
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,URL_SIO.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,URL_SIO.href)
        let socket1 = await client1.start()
        let socket2 = await client2.start()    
        let status 
        status = await sio.status()
        expect(status.clients.length).toEqual(2);

        await client1.stop()
        status = await sio.status()
        expect(status.clients.length).toEqual(1);

        await client2.stop()
        status = await sio.status()
        expect(status.clients.length).toEqual(0);
        await sio.stop()
    });

    it('Socket.io Private Room Test', async () => {
        let sio = await (new SIO(server)).start()
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": this.clientObj1.name,
            "rcvPort": "4001",
            "fwdName": this.clientObj2.name,
            "fwdHost": "localhost",
            "fwdPort": "22"
        }
        sio.rooms.set(room1.name,room1)
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,URL_SIO.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,URL_SIO.href)
        let socket1 = await client1.start()
        let socket2 = await client2.start()
        let json = new JSONData("testclient1","onSendPrivateMsg",{room:"testmocharoom1",msg:"test1"})
        let jsonReply = await client1.emit(json)
        await client1.stop()
        await client2.stop()
        await sio.stop()
        expect(jsonReply.att.msg).toEqual("ack");
    });

    it('Socket.io EchoClient', async () => {
        let sio = await (new SIO(server)).start()
        let SERVER_PORT = 4002;
        let CLIENT_PORT = 4001;
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": this.clientObj1.name,
            "rcvPort": CLIENT_PORT.toString(),
            "fwdName": this.clientObj2.name,
            "fwdHost": "localhost",
            "fwdPort": SERVER_PORT.toString(),
            connections: new Map()
        }
        sio.rooms.set(room1.name,room1)
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,URL_SIO.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,URL_SIO.href)
        let socket1 = await client1.start()
        let socket2 = await client2.start()


        let echoserver = new Echoserver(SERVER_PORT)
        await echoserver.start()
        let echoclient1 = await new Echoclient(CLIENT_PORT);
        let reply1 = await echoclient1.send("ABCD").catch( err => err)
        expect("ABCD").toEqual(reply1);
        await echoserver.stop()
        await client1.stop()
        await client2.stop()
        await sio.stop()
    });

});

describe('\n\n=================== SOCKET.IO & APP TESTS ========================', () => {
   
    before("Before", async ()=>{
        app = require("../sio-app.js")
        this.db = await (require("../mongooseclient.js"))()
        // CREATE CLIENTS      
        let client1 = "testclient1"
        let client2 = "testclient2"
        await this.db.deleteClient(client1)
        await this.db.deleteClient(client2)
        this.clientObj1 = await this.db.createClient(client1)
        this.clientObj2 = await this.db.createClient(client2)
        this.clientObj2.proxyport = "8811"
        await this.db.updateClient(this.clientObj2)
        // DELETE ALL ROOMS WITH TESTUSER
        let rooms = await this.db.getRooms()
        for (const room of rooms) {
            if (room.rcvName == client1 || room.rcvName == client2){
                await this.db.deleteRoom(room)
            }
        }

        // CREATE ADMIN USER
        this.username = "testadmin"
        this.password = "testpassword"
        this.webuser1 = await this.db.deleteWebuser(this.username)           
        this.webuser1 = await this.db.createWebuser(this.username,this.password)
        this.agent = superagent.agent();  


    })

    beforeEach("Before", async ()=>{

    })

    afterEach("AfterEach",  async ()=>{
        
    })

    after("After", async ()=>{
        await this.db.deleteClient(this.clientObj1.name)
        await this.db.deleteClient(this.clientObj2.name)
        await this.db.deleteWebuser(this.username)  
        await this.db.close()
        app.mongooseConnection.close()         
    })

    
    it("USER-AUTH REST API Create/Delete/Update Test", async ()=>{
        this.testServer = new TestServer(app,PORT_MGR)
        this.server = await this.testServer.start()
        let result
        let username = "testdbuser1"
        let password = "testdbpass1"
        this.webuser1 = await this.db.deleteWebuser(username)           
        this.webuser1 = await this.db.createWebuser(username,password)           
        var user1 = superagent.agent();
        var user2 = superagent.agent();
        result = await user1.post( URL_MGR_LOGIN).send({username:username, password:password})
        expect(result.body.id).toEqual(username);
        result = await user1.get( URL_MGR_LOGIN).send({})
        expect(result.body).not.toEqual(false);
        result = await user2.post( URL_MGR_LOGIN).send({username:"baduser", password:password})
        expect(result.body).toEqual(false);
        result = await user2.post( URL_MGR_LOGIN).send({username:username, password:"badpass"})
        expect(result.body).toEqual(false);
        result = await user2.post( URL_MGR_LOGIN).send({})
        expect(result.body).toEqual(false);
        this.webuser1 = await this.db.deleteWebuser(username)           
        await this.testServer.stop()
    })

    it("ROOM REST API Create/Delete/Update Test", async ()=>{
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": "testclient1",
            "rcvPort": "33001",
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": "33002"
        }
        let room2 = {
            "name": "testmocharoom2",
            "rcvName": "testclient1",
            "rcvPort": "44001",
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": "44002"
        }
        let room3 = {
            "name": "testroom3",
            "rcvName": "testclient1",
            "rcvPort": "55001",
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": "55002"
        }
        this.testServer = new TestServer(app,PORT_MGR)
        this.siotestServer = new TestServer(app,PORT_SIO)
        this.server = await this.testServer.start()
        this.sioserver = await this.siotestServer.start()
        let sio = await (new SIO(this.sioserver)).start()
        // deleting all existing rooms
        for (const room of sio.rooms.values()) {
            sio.rooms.delete(room.name)
        }
        let loginres = await this.agent.post( URL_MGR_LOGIN).send({username:this.username,password:this.password})
        let echoserver = new Echoserver(room3.fwdPort)
        await echoserver.start()
        await this.agent.post( URL_MGR_CREATE).send(room1)
        await this.agent.post( URL_MGR_CREATE).send(room2)        
        await this.agent.post( URL_MGR_CREATE).send(room3)   
        await this.agent.post( URL_MGR_CREATE).send(room1)
        await this.agent.post( URL_MGR_CREATE).send(room2)
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,URL_SIO.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,URL_SIO.href)
        await client1.start()
        await client2.start()
        await this.agent.post( URL_MGR_CREATE).send(room1)
        await this.agent.post( URL_MGR_CREATE).send(room2)
        await this.agent.post( URL_MGR_CREATE).send(room3)
        let echoclient1 = await new Echoclient(room3.rcvPort);
        let reply1 = await echoclient1.send("ABCD").catch( error => error)
        expect(reply1).toEqual("ABCD");
        room3.rcvPort = "6001"
        await this.agent.post( URL_MGR_UPDATE).send(room3)
        await delay(1000)
        let echoclient2 = await new Echoclient(room3.rcvPort);
        let reply2 = await echoclient2.send("1234").catch( error => error)
        expect(reply2).toEqual("1234");
        await this.agent.post( URL_MGR_CREATE).send(room1)
        await this.agent.post( URL_MGR_CREATE).send(room2)
        await this.agent.post( URL_MGR_CREATE).send(room3)
        await echoserver.stop()
        await client1.stop()
        await client2.stop()
        await sio.stop()
        await this.testServer.stop()
        await this.siotestServer.stop()
    })

    it("SERVER FAILURE TEST", async ()=>{
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": "testclient1",
            "rcvPort": "33001",
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": "33002"
        }

        let app = require("../sio-app.js")
        let testserver1 = new TestServer(app,PORT_MGR)     
        let server = await testserver1.start()

        let sioapp = require('express')()
        let siotestserver1 = new TestServer(sioapp,PORT_SIO)
        let sioserver = await siotestserver1.start()

        let sio = await (new SIO(sioserver)).start()
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,URL_SIO.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,URL_SIO.href)
        await client1.start()
        await client2.start()
        const superagent = require('superagent').agent();
        await superagent.post( URL_MGR_LOGIN).send({username:this.username,password:this.password})
        await superagent.post( URL_MGR_CREATE).send(room1)
        let echoserver = new Echoserver(room1.fwdPort)
        await echoserver.start()
        await delay(1000)
        let echoclient1 = await new Echoclient(room1.rcvPort);
        let reply1 = await echoclient1.send("ABCD").catch( error => error)
        expect(reply1).toEqual("ABCD");
        await superagent.post( URL_MGR_CREATE).send(room1)
        await sio.stop()
        await testserver1.stop()
        await siotestserver1.stop()
        while ( client1.rooms.size || client1.rooms.size) { 
            await delay(200) 
        }
        let testserver2 = new TestServer(app,PORT_MGR)
        let server2 = await testserver2.start()
        let siotestserver2 = new TestServer(app,PORT_SIO)
        let sioserver2 = await siotestserver2.start()
        sio = await (new SIO(sioserver2)).start()
        await superagent.post( URL_MGR_CREATE).send(room1)
        while ( !client1.rooms.size || !client2.rooms.size) { 
            await delay(500) 
        }
        let echoclient2 = await new Echoclient(room1.rcvPort);
        let reply2 = await echoclient2.send("1234").catch( error => console.log("ECHOCLIENT CONNECTION ERROR:",error))
        expect(reply2).toEqual("1234");
        await superagent.post( URL_MGR_CREATE).send(room1)
        await echoserver.stop()
        await client1.stop()
        await client2.stop()
        await sio.stop()
        await testserver2.stop()
        await siotestserver2.stop()        
    })

    it("CLIENT FAILURE TEST", async ()=>{
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": "testclient1",
            "rcvPort": "33001",
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": "33002"
        }
        let app = require("../sio-app.js")
        let testserver1 = new TestServer(app,PORT_MGR)
        let server = await testserver1.start()

        let sioapp = require('express')()
        let siotestserver1 = new TestServer(sioapp,PORT_SIO)
        let sioserver = await siotestserver1.start()
        
        let sio = await (new SIO(sioserver)).start()
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,URL_SIO.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,URL_SIO.href)
        await client1.start()
        await client2.start()
        const superagent = require('superagent').agent();
        await superagent.post( URL_MGR_LOGIN).send({username:this.username,password:this.password})
        await superagent.post( URL_MGR_CREATE).send(room1)
        let echoserver = new Echoserver(room1.fwdPort)
        await echoserver.start()
        let echoclient1 = await new Echoclient(room1.rcvPort);
        let reply1 = await echoclient1.send("ABCD").catch( error => console.log("ECHOCLIENT CONNECTION ERROR:",error))
        expect(reply1).toEqual("ABCD");
        await client1.stop()

        client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,URL_SIO.href)
        await client1.start()
        while ( !client1.rooms.size || !client2.rooms.size) { 
            await delay(200) 
        }

        let echoclient2 = await new Echoclient(room1.rcvPort);
        let reply2 = await echoclient2.send("1234").catch( error => console.log("ECHOCLIENT CONNECTION ERROR:",error))
        expect(reply2).toEqual("1234");

        await superagent.post( URL_MGR_CREATE).send(room1)
        await echoserver.stop()
        await client1.stop()
        await client2.stop()
        await sio.stop()   
        await testserver1.stop()
        await siotestserver1.stop()                
    })

    it("SOCKS5 PROXY TEST", async ()=>{
        let result        
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": this.clientObj1.name,
            "rcvPort": "1080",
            "fwdName": this.clientObj2.name,
            "fwdHost": "localhost",
            "fwdPort": this.clientObj2.proxyport
        }
        this.testServer = new TestServer(app,PORT_MGR)
        this.server = await this.testServer.start()

        
        let sioapp = require('express')()
        let siotestserver1 = new TestServer(sioapp,PORT_SIO)
        let sioserver = await siotestserver1.start()
        let sio = await (new SIO(sioserver)).start()

        const superagent = require('superagent').agent();
        await superagent.post( URL_MGR_LOGIN).send({username:this.username,password:this.password})
        await superagent.post( URL_MGR_CREATE).send(room1)
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,URL_SIO.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,URL_SIO.href)
        await client1.start()
        await client2.start()


        const SocksClient = require('socks').SocksClient;
        const options = {
            proxy: {
              host: 'localhost', // ipv4 or ipv6 or hostname
              port: parseInt(room1.fwdPort),
              type: 5 // Proxy version (4 or 5)
            },         
            command: 'connect', // SOCKS command (createConnection factory function only supports the connect command)
            destination: {
              host: 'localhost', // github.com (hostname lookups are supported with SOCKS v4a and 5)
              port: parseInt(PORT_MGR)
            }
        };

        const socksClient = await SocksClient.createConnection(options).catch(()=> null); 
        result = socksClient.socket.readable
        socksClient.socket.destroy()
        
        expect(result).toEqual(true);

        await superagent.post( URL_MGR_CREATE).send(room1)
        await client1.stop()
        await client2.stop()
        await sio.stop()
        await this.testServer.stop()
        await siotestserver1.stop()
    })

})


