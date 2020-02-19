"use strict";
//############ PRODUCTION #######################
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
// const fs = require('fs');
// const config = require('config');
const logg = require('why-is-node-running')
// const File = require("ucipass-file")
// const log = require("ucipass-logger")("mocha")

//########### Constants ######################
const port   = process.env.VUE_APP_SERVER_PORT
const prefix = process.env.VUE_APP_PREFIX
const url = new URL("http://localhost:"+ port +"/"+ prefix + "/")
const sio_path = path.posix.join(url.pathname,"socket.io")
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

            roomNumber = (await db.getRooms()).length
            result = await db.deleteRoom(room1)
            result = await db.deleteRoom(room2)
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

describe('\n\n=================== SOCKET.IO TESTS ========================', () => {
    
    let server = null;

    before("Before", async()=>{
        this.db = require("../mongooseclient.js")()      
        await this.db.deleteClient("testclient1")
        await this.db.deleteClient("testclient2")
        this.clientObj1 = await this.db.createClient("testclient1")
        this.clientObj2 = await this.db.createClient("testclient2")    
    })

    beforeEach("Before", async()=>{
        let appalt = require('express')();
        this.testServer = new TestServer(appalt,port)
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
            // socket.on('close', (data,replyFn)=>{
            //     replyFn('ack')
            //     socket.disconnect()
            // })            
        });

        let client = new SIOClient(null,null,url.href)
        let clientSocket = await client.start()
        let clientSocketId = clientSocket.id
        expect(clientSocketId).toEqual(serverSocketID)
        client.stopped = true
        clientSocket.disconnect()
    });

    it('Socket.io Server/Clients (re)Connect Test', async () => {
        let sio = await (new SIO(server)).start()
        let client1 = new SIOClient(null,null,url.href)
        let client2 = new SIOClient(null,null,url.href)
        let clientSocket1 = await client1.start()
        let clientSocket2 = await client2.start()
        expect( sio.sockets.size ).toEqual(2);
        await client1.stop()
        await client2.stop()
        expect( sio.sockets.size ).toEqual(0);
        await sio.stop()
    });

    it('Socket.io Authentication', async () => {

        let sio = await (new SIO(server)).start()
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,url.href)
        let client2 = new SIOClient(this.clientObj2.name,"123",url.href)
        let clientSock1 = await client1.start()
        let clientSock2 = await client2.start()
        expect(sio.getSocketById(clientSock1.id).auth).toEqual(true);
        expect(sio.getSocketById(clientSock2.id).auth).toEqual(false);
        await client1.stop()
        await client2.stop()
        await sio.stop()
    });
    
    it('Socket.io Room Join/Leave Test', async () => {
        let sio = await (new SIO(server)).start()
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": "testclient1",
            "rcvPort": "4001",
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": "22"
        }
        let room2 = {
            "name": "testmocharoom2",
            "rcvName": "testclient1",
            "rcvPort": "4003",
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": "23"
        }
        sio.rooms.set(room1.name,room1)
        sio.rooms.set(room2.name,room2)
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,url.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,url.href)
        let socket1 = await client1.start()
        let socket2 = await client2.start()
        expect((await sio.getRoomMembers("testmocharoom1")).length).toEqual(2);
        await sio.leaveRoom("testmocharoom1",socket1.id)
        expect((await sio.getRoomMembers("testmocharoom1")).length).toEqual(1);
        await client1.stop()
        await client2.stop()
        expect((await sio.getRoomMembers("testmocharoom1")).length).toEqual(0);
        await sio.stop()
    });

    it('Socket.io Private Room Test', async () => {
        let sio = await (new SIO(server)).start()
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": "testclient1",
            "rcvPort": "4001",
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": "22"
        }
        sio.rooms.set(room1.name,room1)
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,url.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,url.href)
        let socket1 = await client1.start()
        let socket2 = await client2.start()
        let json = new JSONData("testclient1","onSendPrivateMsg",{room:"testmocharoom1",msg:"test1"})
        let jsonReply = await client1.emit(json)
        expect(jsonReply.att.msg).toEqual("ack");
        await client1.stop()
        await client2.stop()
        await sio.stop()
    });

    it('Socket.io EchoClient', async () => {
        let sio = await (new SIO(server)).start()
        let SERVER_PORT = 4002;
        let CLIENT_PORT = 4001;
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": "testclient1",
            "rcvPort": CLIENT_PORT.toString(),
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": SERVER_PORT.toString(),
            connections: new Map()
        }
        sio.rooms.set(room1.name,room1)
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,url.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,url.href)
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
   
    before("Before", async ()=>{
        console.log("START")
        app = require("../sio-app.js")
        this.db = await (require("../mongooseclient.js"))()
        // CREATE CLIENTS      
        await this.db.deleteClient("testclient1")
        await this.db.deleteClient("testclient2")
        this.clientObj1 = await this.db.createClient("testclient1")
        this.clientObj2 = await this.db.createClient("testclient2")

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
        this.testServer = new TestServer(app,port)
        this.server = await this.testServer.start()
        let result
        let username = "testdbuser1"
        let password = "testdbpass1"
        this.webuser1 = await this.db.deleteWebuser(username)           
        this.webuser1 = await this.db.createWebuser(username,password)           
        var user1 = superagent.agent();
        var user2 = superagent.agent();
        result = await user1.post( url.href + 'login').send({username:username, password:password})
        console.log(result.body)
        expect(result.body.id).toEqual(username);
        result = await user1.get( url.href + 'login').send({})
        console.log(result.body)
        expect(result.body).not.toEqual(false);
        result = await user2.post( url.href + 'login').send({username:"baduser", password:password})
        console.log(result.body)
        expect(result.body).toEqual(false);
        result = await user2.post( url.href + 'login').send({username:username, password:"badpass"})
        console.log(result.body)
        expect(result.body).toEqual(false);
        result = await user2.post( url.href + 'login').send({})
        console.log(result.body)
        expect(result.body).toEqual(false);
        this.webuser1 = await this.db.deleteWebuser(username)           
        await this.testServer.stop()
    })

    it("ROOM REST API Create/Delete/Update Test", async ()=>{
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": "testclient1",
            "rcvPort": "3001",
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": "3002"
        }
        let room2 = {
            "name": "testmocharoom2",
            "rcvName": "testclient1",
            "rcvPort": "4001",
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": "4002"
        }
        let room3 = {
            "name": "testroom3",
            "rcvName": "testclient1",
            "rcvPort": "5001",
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": "5002"
        }
        this.testServer = new TestServer(app,port)
        this.server = await this.testServer.start()
        let sio = await (new SIO(this.server)).start()
        // deleting all existing rooms
        for (const room of sio.rooms.values()) {
            sio.rooms.delete(room.name)
        }
        let loginres = await this.agent.post( url.href + 'login').send({username:this.username,password:this.password})
        let echoserver = new Echoserver(room3.fwdPort)
        await echoserver.start()
        // const superagent = require('superagent');
        // await superagent.post( url.href + 'create').send(room1)
        // await superagent.post( url.href + 'create' ).send(room2)
        await this.agent.post( url.href + 'delete').send(room1)
        await this.agent.post( url.href + 'delete').send(room2)        
        await this.agent.post( url.href + 'delete').send(room3)      
        await this.agent.post( url.href + 'create').send(room1)
        await this.agent.post( url.href + 'create').send(room2)
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,url.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,url.href)
        await client1.start()
        await client2.start()
        await this.agent.post( url.href + 'delete').send(room1)
        await this.agent.post( url.href + 'delete').send(room2)
        await this.agent.post( url.href + 'create').send(room3)
        let echoclient1 = await new Echoclient(room3.rcvPort);
        let reply1 = await echoclient1.send("ABCD").catch( error => error)
        expect(reply1).toEqual("ABCD");
        room3.rcvPort = "6001"
        await this.agent.post( url.href + 'update').send(room3)
        await delay(1000)
        let echoclient2 = await new Echoclient(room3.rcvPort);
        let reply2 = await echoclient2.send("1234").catch( error => error)
        expect(reply2).toEqual("1234");
        await this.agent.post( url.href + 'delete').send(room1)
        await this.agent.post( url.href + 'delete').send(room2)
        await this.agent.post( url.href + 'delete').send(room3)
        await echoserver.stop()
        await client1.stop()
        await client2.stop()
        await sio.stop()
        await this.testServer.stop()
    })

    it("SERVER FAILURE TEST", async ()=>{
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": "testclient1",
            "rcvPort": "3001",
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": "3002"
        }
        let app = require("../sio-app.js")
        let testserver1 = new TestServer(app,port)
        let server = await testserver1.start()
        let sio = await (new SIO(server)).start()
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,url.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,url.href)
        await client1.start()
        await client2.start()
        const superagent = require('superagent').agent();
        await superagent.post( url.href + 'login').send({username:this.username,password:this.password})
        await superagent.post( url.href + 'create').send(room1)
        let echoserver = new Echoserver(room1.fwdPort)
        await echoserver.start()
        let echoclient1 = await new Echoclient(room1.rcvPort);
        let reply1 = await echoclient1.send("ABCD").catch( error => error)
        expect(reply1).toEqual("ABCD");
        await superagent.post( url.href + 'delete').send(room1)
        await sio.stop()
        await testserver1.stop()
        while ( client1.rooms.size || client1.rooms.size) { 
            await delay(200) 
        }
        let testserver2 = new TestServer(app,port)
        let server2 = await testserver2.start()
        sio = await (new SIO(server2)).start()
        await superagent.post( url.href + 'create').send(room1)
        while ( !client1.rooms.size || !client2.rooms.size) { 
            await delay(200) 
        }

        let echoclient2 = await new Echoclient(room1.rcvPort);
        let reply2 = await echoclient2.send("1234").catch( error => console.log("ECHOCLIENT CONNECTION ERROR:",error))
        expect(reply2).toEqual("1234");
        await superagent.post( url.href + 'delete').send(room1)
        await echoserver.stop()
        await client1.stop()
        await client2.stop()
        await sio.stop()        
    })

    it("CLIENT FAILURE TEST", async ()=>{
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": "testclient1",
            "rcvPort": "3001",
            "fwdName": "testclient2",
            "fwdHost": "localhost",
            "fwdPort": "3002"
        }
        let app = require("../sio-app.js")
        let testserver1 = new TestServer(app,port)
        let server = await testserver1.start()
        let sio = await (new SIO(server)).start()
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,url.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,url.href)
        await client1.start()
        await client2.start()
        const superagent = require('superagent').agent();
        await superagent.post( url.href + 'login').send({username:this.username,password:this.password})
        await superagent.post( url.href + 'create').send(room1)
        let echoserver = new Echoserver(room1.fwdPort)
        await echoserver.start()
        let echoclient1 = await new Echoclient(room1.rcvPort);
        let reply1 = await echoclient1.send("ABCD").catch( error => console.log("ECHOCLIENT CONNECTION ERROR:",error))
        expect(reply1).toEqual("ABCD");
        await client1.stop()

        client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,url.href)
        await client1.start()
        while ( !client1.rooms.size || !client2.rooms.size) { 
            await delay(200) 
        }

        let echoclient2 = await new Echoclient(room1.rcvPort);
        let reply2 = await echoclient2.send("1234").catch( error => console.log("ECHOCLIENT CONNECTION ERROR:",error))
        expect(reply2).toEqual("1234");

        await superagent.post( url.href + 'delete').send(room1)
        await echoserver.stop()
        await client1.stop()
        await client2.stop()
        await sio.stop()        
    })

    it("SOCKS5 PROXY TEST", async ()=>{
        let room1 = {
            "name": "testmocharoom1",
            "rcvName": "testclient1",
            "rcvPort": "1080",
            "fwdName": "testclient2",
            "fwdHost": "localproxy",
            "fwdPort": "1081"
        }
        this.testServer = new TestServer(app,port)
        this.server = await this.testServer.start()
        let sio = await (new SIO(this.server)).start()
        // deleting all existing rooms
        for (const room of sio.rooms.values()) {
            sio.rooms.delete(room.name)
        }
        const superagent = require('superagent').agent();
        await superagent.post( url.href + 'login').send({username:this.username,password:this.password})
        await superagent.post( url.href + 'create').send(room1)
        let client1 = new SIOClient(this.clientObj1.name,this.clientObj1.token,url.href)
        let client2 = new SIOClient(this.clientObj2.name,this.clientObj2.token,url.href)
        await client1.start()
        await client2.start()


        const SocksClient = require('socks').SocksClient;
        const options = {
            proxy: {
              host: 'localhost', // ipv4 or ipv6 or hostname
              port: parseInt(room1.rcvPort),
              type: 5 // Proxy version (4 or 5)
            },         
            command: 'connect', // SOCKS command (createConnection factory function only supports the connect command)
            destination: {
              host: 'localhost', // github.com (hostname lookups are supported with SOCKS v4a and 5)
              port: parseInt(port)
            }
          };
          try {
            const info1 = await SocksClient.createConnection(options); 
            const info2 = await SocksClient.createConnection(options);  
            expect(info1.socket.readable).toEqual(true);       
            expect(info2.socket.readable).toEqual(true);       
          } catch (error) {
            console.log("ERROR!!!!!!:", error)
          }

        await superagent.post( url.href + 'delete').send(room1)
        await client1.stop()
        await client2.stop()
        await sio.stop()
        await this.testServer.stop()
    })

})


