"use strict";
require('events').EventEmitter.defaultMaxListeners = 35;
//############ PRODUCTION #######################
const SIO = require("../sioserver/sio-server.js")
const SIOClient = require("../sioclient/sio-client.js")
const JSONData = require('../lib/jsondata.js')
const mongooseclient = require("../lib/mongooseclient.js")

//############  TESTING   ####################
const Echoserver = require("../lib/echoserver.js")
const Echoclient = require("../lib/echoclient.js")
const delay = require("../lib/delay.js")
const logg = require('why-is-node-running')

const expect = require('expect');
const path = require('path')
// const logg = require('why-is-node-running')
const log = require("ucipass-logger")("mocha")
log.transports.console.level = 'error'

//########### Constants ######################
const PREFIX = process.env.PREFIX ? process.env.PREFIX : ""
const URL_SIO = new URL("http://localhost/")
const PORT_SIO = process.env.PORT ? process.env.PORT : "3002"
URL_SIO.pathname = PREFIX 
URL_SIO.port = PORT_SIO
const SIO_PATH = path.posix.join(URL_SIO.pathname,"socket.io")


describe('=================== SOCKET.IO CLIENT/SERVER TESTS ========================', () => {
    describe.only('Socket.io Basic Connectivity Tests', () => {
        let server,db,sio,url,
        clientObj1,clientObj2,clientObj3,
        clientname1,clientname2,clientname3,
        room1,room2,room3

        before("Before", async()=>{
            db = mongooseclient()
            url = new URL( URL_SIO )

            clientname1 = "mochaclient1"
            clientname2 = "mochaclient2"
            clientname3 = "mochaclient3"           
            clientObj1 = {
                name: clientname1,
                token: "qiowuryefjkhsadgf11kjsadhgfsdjkahg",
                url: URL_SIO.href
            }
            clientObj2 = {
                name: clientname2,
                token: "qiowuryefjkhsadgfkj22sadhgfsdjkahg",
                url: URL_SIO.href
            }
            clientObj3 = {
                name: clientname3,
                token: "qiowuryefjkhsadgfkj33sadhgfsdjkahg",
                url: URL_SIO.href
            }
            await db.deleteClientsAll()
            await db.createClient(clientObj1)
            await db.createClient(clientObj2)            
            await db.createClient(clientObj3)            

            room1 = {
                "name": "testmocharoom1",
                "rcvName": clientname1,
                "rcvPort": "11001",
                "fwdName": clientname2,
                "fwdHost": "localhost",
                "fwdPort": "11002"
            }
            room2 = {
                "name": "testmocharoom2",
                "rcvName": clientname2,
                "rcvPort": "22001",
                "fwdName": clientname1,
                "fwdHost": "localhost",
                "fwdPort": "22002"
            }            
            room3 = {
                "name": "testmocharoom3",
                "rcvName": clientname3,
                "rcvPort": "33001",
                "fwdName": clientname1,
                "fwdHost": "localhost",
                "fwdPort": "33002"
            }            
            await db.deleteRoomsAll()
            await db.createRoom(room1)
            await db.createRoom(room2)
            await db.createRoom(room3)
        })
    
        after("After", async()=>{
            await db.deleteRoom(room1)
            await db.deleteRoom(room2)
            await db.deleteRoom(room3)
            await db.deleteClient(clientname1)
            await db.deleteClient(clientname2)
            await db.close()            
        })
    
        it('Native Client -> Native Server Connection Successful with matching socket ids', async () => {

            server = require('http').createServer().listen(url.port, function(){
                log.info(`server listening on *:${url.port}`);
            });
            
            let io = require('socket.io')(server);
            io.mySockets =[]
            let serverSocket
            io.on('connect', function(socket){
                serverSocket = socket;
                log.info('Socket.id client connected');
                io.mySockets.push(socket)

                socket.on('disconnect', async ()=>{
                    io.mySockets.splice(socket)
                    socket.disconnect()
                })       
            });  
                       

            let clientSocket = await new Promise((resolve, reject) => {
                const cio = require('socket.io-client');
                const options = { 
                    // path: this.sio_path,
                    reconnection: false
                }                
                let socket = cio( URL_SIO.origin);
                socket.on('connect', async ()=>{
                    io.mySockets.push(socket)
                    resolve(socket)
                })
                socket.on('disconnect', async ()=>{
                    io.mySockets.splice(socket)
                    socket.close()
                })
                socket.on('error', (error)=>{
                    if( socket.connected){
                        log.error(`${socket.id}error:`,error.message)                        
                    }
                    resolve(error.message)                       
                })                                              
            });


            let [cliendId,serverId] = [clientSocket.id, serverSocket.id]

            clientSocket.disconnect() //Not really needed
            await new Promise((resolve, reject) => {
                for( const socket of io.mySockets){
                    socket.close()
                }
                io.close(()=>{
                    log.info("Socket.io close complete")
                    resolve(true)
                })                
            });
            await new Promise((resolve, reject) => {
                server.close(()=>{
                    log.info("Server close complete!");
                    resolve(true)
                })
            });
            
            clientSocket = null
            io = null
            await delay(100)
            expect(cliendId).toEqual(serverId)

        });
    
        it('Native Client -> SIO    Server Connection Successful with matching socket ids', async () => {

            sio = new SIO();
            log.debug("SIO Server Starting")
            await sio.start()
            await delay(100)
            log.debug("Native Client Starting")
            let clientSocket = new Promise((resolve, reject) => {
                const ioclient = require('socket.io-client');
                const options = { 
                    path: SIO_PATH,
                    reconnection: false
                }                
                let socket = ioclient( URL_SIO.origin, options);
                socket.on('connect', async ()=>{
                    log.debug("Native Client Connect")
                    resolve(socket)
                })
                socket.on('disconnect', async ()=>{
                    log.debug("Native Client Disconnect ID:")
                    socket.disconnect()
                })
                socket.on('error', (error)=>{
                        log.error(`${socket.id}error:`,error.message)                                           
                })                                              
            });

            [clientSocket] = await Promise.all([clientSocket])
            log.debug("Native Client Promise Complete")
            let serverId = Object.keys(sio.io.sockets.connected)[0]
            let clientId = clientSocket.id
            clientSocket.disconnect()
            delete
            await delay(200)
            await sio.stop()
            expect(clientId).toEqual(serverId)
        });

        it('SIO Client    -> Native Server Connection Successful with matching socket ids', async () => {

            server = require('http').createServer().listen(url.port, function(){
                log.info(`server listening on *:${url.port}`);
            });
            const options = { path: SIO_PATH }   
            let io = require('socket.io')(server, options);
            io.mySockets =[]
            let serverSocket = new Promise((resolve, reject) => {
                io.on('connect', function(socket){
                    log.info('Socket.id client connected');
                    io.mySockets.push(socket)
                    socket.on('disconnect', async ()=>{
                        io.mySockets.splice(socket)
                    })                                                          
                    socket.on('error', async (error)=>{
                        log.error(error);
                    })                       
                    socket.on('login', async (error,replyFn)=>{
                        replyFn('ack');
                    })                       
                    resolve(socket)
                });                        
            });

            let client = new SIOClient(clientObj1.name,clientObj1.token,URL_SIO.href)    
            let clientSocket = await client.start() 
            let cliendId = clientSocket.id
            let serverId = (await serverSocket).id
            await client.stop()

            await new Promise((resolve, reject) => {
                io.close(()=>{
                    log.info("Socket.io close complete")
                    return(resolve(true))
                })                
            });
            await new Promise((resolve, reject) => {
                server.close(()=>{
                    log.info("Server is stopped!");
                    return(resolve(true))
                })
            });

            expect(cliendId).toEqual(serverId)
        });

        it('SIO Client    -> SIO    Server Connection Successful with matching socket ids', async () => {
            
            sio = new SIO();
            await sio.start()
            let client = new SIOClient(clientObj1.name,clientObj1.token,URL_SIO.href)    
            let clientSocket = await client.start() 
            let clientId = clientSocket.id
            let serverId = (await sio.status()).clients[0].id

            client.stop()
            await client
            await sio.stop()
            expect(clientId).toEqual(serverId)
        });

        it('Client Authentication Failed Check', async () => {
            sio = new SIO();
            await sio.start()
            let client2 = new SIOClient(clientObj1.name,"badpass",URL_SIO.href)    
            let clientSock2 = await client2.start()
            let status = await sio.status()
            let clientSocket = status.clients.find( client => client.id == clientSock2.id ) 
            let auth = clientSocket ? clientSocket.auth : false
            await client2.stop()
            await sio.stop()
            expect(auth).not.toEqual(true);
        });        
     
        it('Client Reconnect with Client Restart', async () => {
            sio = new SIO();
            await sio.start()
            let client1 = new SIOClient(clientObj1.name,clientObj1.token,URL_SIO.href)    
            let clientSock1 = await client1.start() 

            let clientcount1 = (await sio.status()).clients.length
            await client1.stop()
            let clientcount2 = (await sio.status()).clients.length
            client1 = new SIOClient(clientObj1.name,clientObj1.token,URL_SIO.href)
            await client1.start()
            let clientcount3 = (await sio.status()).clients.length

            await client1.stop()
            await sio.stop()
            expect(clientcount1).toEqual(1);
            expect(clientcount2).toEqual(0);
            expect(clientcount3).toEqual(1);
        });        
     
        it('Client Reconnect with Server Restart', async () => {
            sio = new SIO();
            await sio.start()

            let client1 = new SIOClient(clientObj1.name,clientObj1.token,URL_SIO.href)    
            client1.connectionRetryMs = 200  // if connection fails retry
            let clientSock1 = await client1.start() 
            let clientcount1 = (await sio.status()).clients.length
            await sio.stop()
            sio = new SIO();
            await sio.start()
            await delay(1000)
            let clientcount2 = (await sio.status()).clients.length
            await client1.stop()
            await sio.stop()

            expect(clientcount1).toEqual(1);
            expect(clientcount2).toEqual(1);
        });        

        it('Client Reconnect with Client Delete/Re-create', async () => {
            sio = new SIO();
            await sio.start()

            //Auth Success
            let client1 = new SIOClient(clientObj1.name,clientObj1.token,URL_SIO.href)  
            client1.connectionRetryMs = 500  
            let clientSock1 = await client1.start() 
            let status = await sio.status()
            let c1 = status.clients.find( client => client.id == clientSock1.id )


            //Client kicked out Auth Failure
            await db.deleteClient(clientObj1.name)
            await sio.refresh()
            await delay(1000)
            let status2 = await sio.status()
            let c2 = status2.clients.find( client => client.id == clientSock1.id )
            c2 = c2 ? c2 : {auth: false}
            
            //Client created again Auth Success
            await db.createClient(clientObj1)
            await sio.refresh()
            await delay(1000)
            let status3 = await sio.status()
            let c3 = status3.clients.find( client => client.id == clientSock1.id )
            
            await client1.stop()
            await sio.stop()
            expect(c1.auth).toEqual(true);
            expect(c2.auth).toEqual(false);
            // expect(c3.auth).toEqual(true);
        });        

        it('Client Room Create/Delete/Re-create', async () => {
            
            sio = new SIO();
            await sio.start()
            let client1 = new SIOClient(clientObj1.name,clientObj1.token,URL_SIO.href)    
            let client2 = new SIOClient(clientObj2.name,clientObj2.token,URL_SIO.href)    
            let clientSocket1 = await client1.start() 
            let clientSocket2 = await client2.start() 

            let roomcount1 = (await sio.status()).rooms.length
            await db.deleteRoom(room1)
            await sio.refresh()
            let roomcount2 = (await sio.status()).rooms.length
            await db.deleteRoom(room3)
            await sio.refresh()
            let roomcount3 = (await sio.status()).rooms.length
            await db.createRoom(room1)
            await db.createRoom(room3)
            await sio.refresh()
            let roomcount4 = (await sio.status()).rooms.length
            let status = (await sio.status())
            let echoclient, echoserver
            echoserver = new Echoserver(room1.fwdPort)
            await echoserver.start()
            echoclient = await new Echoclient(room1.rcvPort);
            let reply1 = await echoclient.send("ABCD").catch( err => err)            
            await echoserver.stop()
            
            await client1.stop()
            await client2.stop()
            await sio.stop()
            expect(roomcount1).toEqual(3)
            expect(roomcount2).toEqual(2)
            expect(roomcount3).toEqual(1)
            expect(roomcount4).toEqual(3)
            expect(reply1).toEqual("ABCD")
        });

        it('Client Private Message to another client', async () => {
            
            sio = new SIO();
            await sio.start()
            let client1 = new SIOClient(clientObj1.name,clientObj1.token,URL_SIO.href)    
            let client2 = new SIOClient(clientObj2.name,clientObj2.token,URL_SIO.href)    
            await client1.start() 
            await client2.start() 

            let json = new JSONData(clientname1,"onSendPrivateMsg",{room: room1.name ,msg:"test1"})
            let jsonReply = await client1.emit(json)
            await client1.stop()
            await client2.stop()
            await sio.stop()
            expect(jsonReply.att.msg).toEqual("ack");

        });
        
        it('REST API Status Request', async () => {
            sio = new SIO();
            await sio.start()
            let client1 = new SIOClient(clientObj1.name,clientObj1.token,URL_SIO.href)    
            let client2 = new SIOClient(clientObj2.name,clientObj2.token,URL_SIO.href)    
            await client1.start() 
            await client2.start() 
            const superagent = require('superagent');
            const URL2 = URL_SIO.href + "/status"
            let reply = await superagent.get(URL2).catch( e=> "failure")
            let status = reply.body
            await client1.stop()
            await client2.stop()
            await sio.stop()
            expect(status.clients_authenticated).toEqual(2);
        });
        
        it('REST API Refresh Request', async () => {
            sio = new SIO();
            await sio.start()
            let client1 = new SIOClient(clientObj1.name,clientObj1.token,URL_SIO.href)    
            let client2 = new SIOClient(clientObj2.name,clientObj2.token,URL_SIO.href)    
            await client1.start() 
            await client2.start() 
            const superagent = require('superagent');
            const URL = URL_SIO.href + "/refresh"
            let reply1 = await superagent.get(URL).catch( e=> "failure")
            let status1 = reply1.body
            await client1.stop()
            let reply2 = await superagent.get(URL).catch( e=> "failure")
            let status2 = reply2.body
            await client2.stop()
            await sio.stop()
            expect(status1.clients_authenticated).toEqual(2);
            expect(status2.clients_authenticated).toEqual(1);
        });
        
    })
    
});


