"use strict";
require('events').EventEmitter.defaultMaxListeners = 35;

//############  TESTING   ####################
const path = require('path')
const superagent = require('superagent');
const expect = require('expect');
const app = require("../manager/app.js")
const httpserver = require("../lib/httpserver.js")
const mongooseclient = require("../lib/mongooseclient.js")
const delay = require("../lib/delay.js")
// const logg = require('why-is-node-running')
// const log = require("ucipass-logger")("mocha")

//########### Constants ######################

const URL_MGR = new URL("http://localhost/")    
URL_MGR.pathname = process.env.MANAGER_PREFIX ? process.env.MANAGER_PREFIX : ""
URL_MGR.port   = process.env.MANAGER_PORT ? process.env.MANAGER_PORT : "3001"
const URL_MGR_LOGIN = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,"login")
const CLIENT_PREFIX = "sioclients"
const WEBUSER_PREFIX = "webusers"

describe('=================== MANAGER TESTS ========================', () => {

    after("After", async ()=>{
        await app.mongooseConnection.close()
    })

    describe('Web User Authentication', () => {
        let db,server
        let user1, user2
        
        before("Before", async ()=>{
            db = mongooseclient()
            server = new httpserver({app:app,port:URL_MGR.port})
            await server.start()
        })

        beforeEach("BeforeEach", async ()=>{
            user1 = {
                username: "mochatestuser1",
                password: "mochatestuser1pass"
            }
            user2 = {
                username: "mochatestuser2",
                password: "mochatestuser2pass"
            }            
            await db.deleteWebuser(user1.username)           
            await db.createWebuser(user1.username,user1.password)
        })

        after("After", async ()=>{
            await server.stop()
            await db.deleteWebuser(user1.username)    
            await db.close()
        })

        it("Login Success", async ()=>{
            var agent1 = superagent.agent(app);
            let result = await agent1.post( URL_MGR_LOGIN ).send(user1)
            expect(result.body.id).toEqual(user1.username);
            result =     await agent1.get( URL_MGR_LOGIN).send({})
            expect(result.body).toEqual("success");            
        })

        it("Login Failure - Bad Password", async ()=>{
            var agent1 = superagent.agent(app);
            user1.password = "badpass"
            let result = await agent1.post( URL_MGR_LOGIN ).send(user1)
            expect(result.body).toEqual(false);
            result =     await agent1.get( URL_MGR_LOGIN).send({})
            expect(result.body).not.toEqual("success");            
        })

        it("Login Failure - Bad Username", async ()=>{
            var agent1 = superagent.agent(app);
            user1.username = "baduser"
            let result = await agent1.post( URL_MGR_LOGIN ).send(user1)
            expect(result.body).toEqual(false);
            result =     await agent1.get( URL_MGR_LOGIN).send({})
            expect(result.body).not.toEqual("success");            
        })
    
    })

    describe('Web Users', ()=>{
        let db,server
        let webuser1,webuser2,webuser3
        let agent1
        let result
        
        before("Before", async ()=>{
            let agentuser = {
                username: "admin",
                password: "admin"
            }
            db = mongooseclient()        
            server = new httpserver({app:app,port:URL_MGR.port})
            await server.start()
            agent1 = superagent.agent(app);
            await agent1.post( URL_MGR_LOGIN ).send(agentuser)              
        })
        beforeEach("BeforeEach", async ()=>{
            webuser1 = {
                username: "mochatestwebuser1",
                password: "mochatestwebuserpass1"
            }
            webuser2 = {
                username: "mochatestwebuser2",
                password: "mochatestwebuserpass2"
            }
            webuser3 = {
                username: "mochatestwebuser3",
                password: "mochatestwebuserpass3"
            }
            await db.deleteWebuser(webuser1)          
            await db.deleteWebuser(webuser2)                              
            await db.deleteWebuser(webuser3)          
            await db.createWebuser(webuser1)          
            await db.createWebuser(webuser2)     
        }) 
        afterEach("AfterEach", async ()=>{
            await db.deleteWebuser(webuser1)          
            await db.deleteWebuser(webuser2)          
            await db.deleteWebuser(webuser3)          
        }) 
        after("After", async ()=>{
            await server.stop()
            await db.close()
        })

        it("Read Webusers", async ()=>{
            const URL = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,WEBUSER_PREFIX,"read")          
            let result = await agent1.post( URL ).send()
            expect(result.body.length).toBeGreaterThanOrEqual(2);         
        })
       
        it("Create Webuser", async ()=>{
            const URL = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,WEBUSER_PREFIX,"create")          
            let result = await agent1.post( URL ).send(webuser3)
            expect(result.body).toEqual("success");         
        })

        it("Delete Webuser", async ()=>{
            const URL = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,WEBUSER_PREFIX,"delete")          
            let result = await agent1.post( URL ).send(webuser3)
            expect(result.body).toEqual("success");         
        })

        it("Update Webuser", async ()=>{
            const URL = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,WEBUSER_PREFIX,"update")          
            webuser2.password = "newpass"
            let result = await agent1.post( URL ).send(webuser2)
            const URL2 = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,WEBUSER_PREFIX,"read")          
            let result2 = await agent1.post( URL2 ).send()
            let newwebuser = result2.body.find( w => w.username == webuser2.username)
            expect(result.body).toEqual("success");         
            expect(webuser2.password).toEqual(newwebuser.password);         
        })
       
    })

    describe('Socket.io Clients', ()=>{
        let db,server
        let user1
        let client1,client2,client3
        let agent1
        let result
        
        before("Before", async ()=>{
            user1 = {
                username: "mochatestuser1",
                password: "mochatestuser1pass"
            }
            db = mongooseclient()
            await db.deleteWebuser(user1.username)           
            await db.createWebuser(user1.username,user1.password)            
            server = new httpserver({app:app,port:URL_MGR.port})
            await server.start()
            agent1 = superagent.agent(app);
            await agent1.post( URL_MGR_LOGIN ).send(user1)              
        })
        beforeEach("BeforeEach", async ()=>{

            client1 = {
                "name": "testmochaclient1",
                "token": "tokenpass1"
            }
            client2 = {
                "name": "testmochaclient2",
                "token": "tokenpass2"
            }
            client3 = {
                "name": "testmochaclient3",
                "token": "tokenpass3"
            }             
            await db.deleteClient(client1)          
            await db.deleteClient(client2)          
            await db.deleteClient(client3)          
            await db.createClient(client1)          
            await db.createClient(client2)     
        }) 
        afterEach("AfterEach", async ()=>{
            await db.deleteClient(client1)          
            await db.deleteClient(client2)          
            await db.deleteClient(client3)          
        }) 
        after("After", async ()=>{
            await server.stop()
            await db.deleteWebuser(user1.username)           
            await db.close()
        })

        it("Read Client", async ()=>{
            const URL = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,CLIENT_PREFIX,"read")          
            let result = await agent1.post( URL ).send(client1)
            expect(result.body.length).toBeGreaterThanOrEqual(2);         
        })
       
        it("Create Client", async ()=>{
            const URL = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,CLIENT_PREFIX,"create")          
            let result = await agent1.post( URL ).send(client3)
            expect(result.body).toEqual("success");         
        })
       
        it("Delete Client", async ()=>{
            const URL = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,CLIENT_PREFIX,"delete")          
            let result = await agent1.post( URL ).send(client3)
            expect(result.body).toEqual("success");         
        })

        it("Update Client", async ()=>{
            const URL = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,CLIENT_PREFIX,"update")          
            client1.token = "newtokenpass1"
            client2.token = "newtokenpass2"
            let result1 = await agent1.post( URL ).send(client1)
            let result2 = await agent1.post( URL ).send(client2)
            const URL2 = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,CLIENT_PREFIX,"read")          
            let result3 = await agent1.post( URL2 ).send(client1)
            let client = result3.body.find( c => c.name == client1.name)
            expect(result1.body).toEqual("success");
            expect(result2.body).toEqual("success");
            expect(result2.body).toEqual("success");
            expect(client.token).toEqual("newtokenpass1");
        }) 
       
    })

    describe('Socket.io Rooms', ()=>{
        let db,server
        let user1
        let room1,room2,room3
        let agent1
        let result
        
        before("Before", async ()=>{
            user1 = {
                username: "mochatestuser1",
                password: "mochatestuser1pass"
            }
            db = mongooseclient()
            await db.deleteWebuser(user1.username)           
            await db.createWebuser(user1.username,user1.password)            
            server = new httpserver({app:app,port:URL_MGR.port})
            await server.start()
            agent1 = superagent.agent(app);
            result = await agent1.post( URL_MGR_LOGIN ).send(user1)              
        })
        beforeEach("BeforeEach", async ()=>{

            room1 = {
                "name": "testmocharoom1",
                "rcvName": "testclient1",
                "rcvPort": "33001",
                "fwdName": "testclient2",
                "fwdHost": "localhost",
                "fwdPort": "33002"
            }
            room2 = {
                "name": "testmocharoom2",
                "rcvName": "testclient1",
                "rcvPort": "44001",
                "fwdName": "testclient2",
                "fwdHost": "localhost",
                "fwdPort": "44002"
            }
            room3 = {
                "name": "testmocharoom3",
                "rcvName": "testclient1",
                "rcvPort": "55001",
                "fwdName": "testclient2",
                "fwdHost": "localhost",
                "fwdPort": "55002"
            }             
            await db.deleteRoom(room1)          
            await db.deleteRoom(room2)          
            await db.deleteRoom(room3)          
            await db.createRoom(room1)          
            await db.createRoom(room2)     
        }) 
        afterEach("AfterEach", async ()=>{
            await db.deleteRoom(room1)          
            await db.deleteRoom(room2)          
            await db.deleteRoom(room3)          
        }) 
        after("After", async ()=>{
            await server.stop()
            await db.deleteWebuser(user1.username)           
            await db.close()
        })

        it("Read Rooms", async ()=>{
            const URL = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,"read")          
            let result = await agent1.post( URL ).send(room1)
            expect(result.body.length).toEqual(2);         
        })
       
        it("Create Room", async ()=>{
            const URL = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,"create")
            let result = await agent1.post( URL ).send(room3)
            expect(result.body).toEqual("success");         
        })
       
        it("Delete Room", async ()=>{
            const URL = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,"delete")
            let agent1 = superagent.agent(app);
            await agent1.post( URL_MGR_LOGIN ).send(user1)            
            let result = await agent1.post( URL ).send(room2)
            expect(result.body).toEqual("success");         
        })
       
        it("Update Room", async ()=>{
            const URL_READ = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,"read")
            const URL_UPDATE = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,"update")
            let result = await agent1.post( URL_READ ).send(room2)    
            let testroom = result.body[0]
            testroom.fwdPort = "51111"
            await agent1.post( URL_UPDATE ).send(testroom)  
            let result2 = await agent1.post( URL_READ ).send(testroom)  
            let testroom2 = result2.body[0]        
            expect(testroom.fwdPort).toEqual(testroom2.fwdPort);         
        })
       
    })

    describe('Socket.io status to Manager', ()=>{
        let db,server
        let webuser1,webuser2,webuser3
        let agent1
        let result
        
        before("Before", async ()=>{
            let agentuser = {
                username: "admin",
                password: "admin"
            }
            db = mongooseclient()        
            server = new httpserver({app:app,port:URL_MGR.port})
            await server.start()
            agent1 = superagent.agent(app);
            await agent1.post( URL_MGR_LOGIN ).send(agentuser)              
        })
        beforeEach("BeforeEach", async ()=>{
            webuser1 = {
                username: "mochatestwebuser1",
                password: "mochatestwebuserpass1"
            }
            webuser2 = {
                username: "mochatestwebuser2",
                password: "mochatestwebuserpass2"
            }
            webuser3 = {
                username: "mochatestwebuser3",
                password: "mochatestwebuserpass3"
            }
            await db.deleteWebuser(webuser1)          
            await db.deleteWebuser(webuser2)                              
            await db.deleteWebuser(webuser3)          
            await db.createWebuser(webuser1)          
            await db.createWebuser(webuser2)     
        }) 
        afterEach("AfterEach", async ()=>{
            await db.deleteWebuser(webuser1)          
            await db.deleteWebuser(webuser2)          
            await db.deleteWebuser(webuser3)          
        }) 
        after("After", async ()=>{
            await server.stop()
            await db.close()
        })

        it("Fix it - Get Status", async ()=>{
            const URL = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,WEBUSER_PREFIX,"update")          
            webuser2.password = "newpass"
            let result = await agent1.post( URL ).send(webuser2)
            const URL2 = URL_MGR.origin + path.posix.join("/",URL_MGR.pathname,WEBUSER_PREFIX,"read")          
            let result2 = await agent1.post( URL2 ).send()
            let newwebuser = result2.body.find( w => w.username == webuser2.username)
            expect(result.body).toEqual("success");         
            expect(webuser2.password).toEqual(newwebuser.password);         
        })
       
    })

})
