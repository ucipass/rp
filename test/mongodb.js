"use strict";
require('events').EventEmitter.defaultMaxListeners = 35;

const expect = require('expect');
const path = require('path')
const mongooseclient = require("../lib/mongooseclient.js")
// const logg = require('why-is-node-running')
// const File = require("ucipass-file")
// const log = require("ucipass-logger")("mocha")

//########### Constants ######################
const prefix = process.env.VUE_APP_PREFIX ? process.env.VUE_APP_PREFIX : ""
const URL_MGR = new URL("http://localhost/")
const PORT_MGR   = process.env.VUE_APP_SERVER_PORT ? process.env.VUE_APP_SERVER_PORT : "3001"
URL_MGR.pathname = prefix 
URL_MGR.port = PORT_MGR

const URL_SIO = new URL("http://localhost/")
const PORT_SIO = process.env.PORT_MGR ? process.env.PORT_MGR : "3002"
URL_SIO.pathname = prefix 
URL_SIO.port = PORT_SIO


describe('=================== MONGODB TESTS ========================', () => {
    
    describe("MongoDB Client Management", async ()=>{
        let db,client,clientObj,result
        beforeEach( async ()=>{
            db = mongooseclient()
            client = "testclient1123456"            
            await db.deleteClient(client)
        })
        afterEach( async ()=>{
            await db.deleteClient(client)
            await db.close() 
        })

        it("Create/Verify Client", async ()=>{
            await db.createClient(client)
            clientObj = await db.getClient(client)
            result = await db.verifyClient(clientObj.name,clientObj.token)
            expect(result).toEqual(true)                     
        })
        it("Delete Client", async ()=>{
            await db.createClient(client)
            await db.deleteClient(client)
            clientObj = await db.getClient(client)
            expect(clientObj).toEqual(null)     

            
            await db.deleteWebuser("test1")   
            await db.createWebuser("test1","test2")                
            result = await db.getWebuser("test1")       
            expect(result.username).toEqual("test1") 
                 
        })
    })

    describe("MongoDB Webuser Management", async ()=>{
        let db, webuser,webpass,result
        beforeEach( async ()=>{
            db = mongooseclient()
            webuser = "mocha1"
            webpass = "mochapass"
        })
        afterEach( async ()=>{
            await db.close() 
        })

        it("Delete Webuser", async ()=>{           
            await db.deleteWebuser(webuser)            
            result = await db.getWebuser(webuser)       
            expect(result).toEqual(null) 
                 
        })

        it("Create Webuser", async ()=>{           
            await db.deleteWebuser(webuser)   
            await db.createWebuser(webuser,webpass)                
            result = await db.getWebuser(webuser)       
            expect(result.username).toEqual(webuser) 
        })
    })

    
    describe("MongoDB Rooms Management", async ()=>{
        let db,result,room1,room2,roomNumber
        
        beforeEach( async ()=>{
            db = mongooseclient()
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
            await db.deleteRoom(room1)
            await db.deleteRoom(room2)
        })
        
        afterEach( async ()=>{
            await db.close() 
            db.deleteRoom(room1)
            db.deleteRoom(room2)
    })

    it("Create Rooms", async ()=>{
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
    })
    it("Delete Rooms", async ()=>{
        roomNumber = (await db.getRooms()).length
        result = await db.createRoom(room1)
        result = await db.createRoom(room2)
        result = await db.deleteRoom(room1)
        result = await db.getRooms()
        expect(result.length).toEqual(roomNumber+1) 
    })
})


})
