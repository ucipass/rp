const io = require('socket.io-client');
const net = require('net');
const path = require('path')
var log = require("ucipass-logger")("sio-client")
log.transports.console.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : "info"
const JSONData = require('../lib/jsondata.js')
const socks5 = require('simple-socks')
const File = require('ucipass-file')
const delay = require('../lib/delay.js')
const axios = require('axios');
const proxy = require('@ucipass/proxy')
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');
var readlineSync = require('readline-sync');
axiosCookieJarSupport(axios);

/**** FLOW *****
1. Client connects to server: start()
2. Client receives configuration from server: onStartRoom()
    a: Listener role: starts getTcpListener() and triggers rcvTcpConnRequest() on new connections
    b: Forwarder role: listens on connections forwarded from server: onTcpConnRequest()
3. Client sending/receiving onTcpConnClose via socket.io if tcp connection terminates
****************/

class SocketIoClient  {
    constructor(username,password,url) {
        if(typeof username === 'object' && username !== null){
            this.username = username.name 
            this.password = username.token
            this.url = username.url
        }else{
            this.username = username ? username : "anonymous"
            this.password = password ? password : "anonymous"
            this.url = url          
        }

        try {
            this.url = new URL( this.url )
        } catch (error) {
            log.error("INVALID URL:", this.url)
            process.exit()
        }   

        this.sio_url = this.url.origin
        this.sio_path = path.posix.join(this.url.pathname,"socket.io")
        this.sio_opts = { 
            reconnection: true, 
            path: this.sio_path 
        }

        this.connectionRetryMs = 10000  // if connection fails retry
        this.rooms = new Map()
        this.socket = null
        this.reconnectAttempt = 0
        this.stopped = false
        this.socketId = ""
        this.auth = false
        this.log = log
        this.proxy = null
    }

    get id() { return `${this.socketId}(${this.username})`}

    start(){
        return new Promise((resolve, reject) => { try {
            log.debug(`Connecting to: ${this.sio_url} path: ${this.sio_opts.path}`)
            this.socket = io( this.sio_url , this.sio_opts );

            this.socket.on('connect', async ()=>{
                this.reconnectAttempt = 0
                log.info(`${this.socket.id} connected to: ${this.sio_url} path: ${this.sio_opts.path}`)
                this.socketId = this.socket.id
                let result = await this.login.call(this, this.username, this.password)
                if (result == "ack"){
                    log.info(`${this.socket.id} login scucces!`)
                    return resolve(this.socket)
                }
                else{
                    log.info(`${this.socket.id} login failure!`)
                    let socket = this.socket
                    return resolve(socket)                     
                }

            })    

            this.socket.on('disconnect', async (reason) => {
                this.reconnectAttempt = 0
                log.info(`${this.socketId}(${this.username}) disconnect reason:`,reason)
                this.rooms.forEach((room)=>{
                    // Disconnect TCP Listener, if present
                    if( room.tcpserver){
                        room.tcpserver.close(()=>{
                            log.debug(`${this.id}: stopped listening at ${room.rcvPort}`);
                            room.tcpserver.unref()
                        })                        
                    }
                    // Disconnect TCP Forwarder, if present
                    let connections = room.connections
                    connections.forEach((connection)=>{
                        if (connection && connection.tcpsocket) {
                            connection.tcpsocket.destroy()
                            connections.delete(connection.connectionID)            
                        }                            
                    })
                    this.rooms.delete(room.name)
                })

                let counter = 0
                log.debug(`${this.id}: waiting for explicit client stop in 500ms until reconnect`);
                await delay(500)
                while(!this.stopped){
                    counter = counter + 100
                    log.debug(`${this.id}: connection will restart in ${this.connectionRetryMs-counter} ms`);
                    if(counter >= this.connectionRetryMs){
                        this.stopped = false
                        this.socket.destroy();
                        this.start()
                        break                    
                    }else{
                        await delay(100)
                    } 

                }
                return true
                // if (this.stopped){
                //     log.debug(`${this.id}: connection will not restart`);
                //     return true
                // }else{
                //     log.debug(`${this.id}: connection will restart in ${this.connectionRetryMs} ms`);
                //     await delay(this.connectionRetryMs)
                //     this.start()                    
                // }

            });

            this.socket.on('onData', this.onData.bind(this));

            this.socket.on('onTcpConnRequest', this.onTcpConnRequest.bind(this));
            
            this.socket.on('onOpenRoom', this.onOpenRoom.bind(this));
            
            this.socket.on('onCloseRoom', this.onCloseRoom.bind(this));
            
            this.socket.on('onStartProxy', this.onStartProxy.bind(this));
            
            this.socket.on('onStopProxy', this.onStopProxy.bind(this));
            
            this.socket.on('onTcpConnClose', this.onTcpConnClose.bind(this));
            
            this.socket.on('onSendPrivateMsg', this.onSendPrivateMsg.bind(this));

            this.socket.on('reconnect', (attemptNumber) => {
                this.socketId = this.socket.id
                log.debug(`${this.id}:successful reconnect no:`,attemptNumber)
            });

            this.socket.on('reconnect_attempt', (attemptNumber) => {
                log.debug(`${this.id}:reconnect_attempt no:`,attemptNumber)
            });

            this.socket.on('reconnecting', (attemptNumber) => {
                log.debug(`${this.id}:Reconnection attempt to ${this.url.href}. Attempt#:`,attemptNumber)
                this.reconnectAttempt = attemptNumber
              });

            this.socket.on('reconnect_error', (error) => {
                log.debug(`${this.id}:reconnect_error:`,error.message)
            });
            
            this.socket.on('reconnect_failed', () => {
                log.debug(`${this.id}:reconnect_failed:`)
            });
            
            this.socket.on('connect_error', (error)=>{
                log.error(`${this.id}:Connection to ${this.url.href} failed! Attempt:${this.reconnectAttempt}`)
                // reject(true)
            })
            
            this.socket.on('connect_timeout', (error)=>{
                log.error(`${this.id}:connect_timeout:`,error.message)
                // reject(true)
            })            

            this.socket.on('error', (error)=>{
                if (this.stopped){
                    log.debug(`${this.id}: ${this.socketId} already stopped error:`,error.message)
                    // reject(true)     
                }else{
                    log.error(`${this.id}error:`,error.message)
                    reject(true)                    
                }

            })            

            this.socket.on('pong', (latency) => {
                log.silly(`pong ${this.socket.id} latency:`,latency)
            });
        } catch (error) {
            console.log(error)
        }
        });
    }

    async stop(){
        this.stopped = true

        // Closing Proxy
        await this.stopProxy()

        // CLOSING TCP
        this.rooms.forEach(room => {
            log.debug(`${this.id} closing room ${room.name}`)
            // Closing TCP Sockets
            if (room.connections){
                room.connections.forEach(connection => {
                    log.debug(`${this.id}: closing tcp socket ${room.name}`);
                    connection.tcpsocket.destroy()
                });                    
            }
            // Closing TCP Server
            if (room.tcpserver){
                room.tcpserver.close(()=>{
                    log.debug(`${this.id}: stopped listening at ${room.rcvPort}`);
                    room.tcpserver.unref()
                    // resolve(true)
                })
            }              
        });

        // CLOSING SOCKET.IO 
        log.debug(`${this.id} close initiated`)
        while (this.socket && this.socket.connected){
            this.socket.disconnect(true)
            await new Promise((resolve) => {
                setTimeout(resolve, 100);
            });
        }
        return (true) 
    }

    async startProxy(proxyport){
            this.proxy = await proxy(proxyport)
            return this.proxy
    }

    async stopProxy(){
        if (this.proxy) return this.proxy.stop()
    }

    login(user,pass){
        let username = user ? user : this.username
        let password = pass ? pass : this.password
        return new Promise((resolve, reject) => {
            this.socket.emit('login',{username:username, password:password},(replyData)=>{
                if(replyData == 'ack'){
                    log.info(`${this.id} login success`)
                    this.auth = true;
                    return resolve(replyData) 
                }else{
                    log.warn(`${this.id} login failure`)
                    this.auth = false;
                    return resolve(replyData)
                }
            })            
        });
    }

    logout(){
        return new Promise((resolve, reject) => {
            this.socket.emit('logout','logout',(replyData)=>{
                if(replyData == 'ack'){
                    log.info(`${this.id} logout success`)
                    resolve(replyData) 
                }else{
                    log.error(`${this.id} logout failure`)
                    resolve(replyData)
                }
            })            
        });
    }

    async emit(json){
        let reply = new Promise((resolve, reject) => {
            log.debug(`${this.id} sent json`)
            this.socket.emit(json.type,json,(replyData)=>{
                log.debug(`${this.id} received json acknowledment`)
                let jsondata = new JSONData()
                jsondata = jsondata.setjson(replyData.json)
                return resolve(jsondata) 
            })
        })
        return reply
    }

    async onSendPrivateMsg(data, replyFn){
        let json = (new JSONData()).setjson(data.json)
        json.id = this.username
        json.att.msg = 'ack'
        log.debug(`${this.id} received onSendPrivateMsg JSON message`)
        return replyFn(json)        
    }

    // client configuration is pushed by server upon successfuul auth
    async onOpenRoom (data,replyFn){
        let json = (new JSONData().setjson(data.json))
        let room = json.att.room
        if ( room.rcvName == this.username){
            log.info(`${this.id} received ${room.name} config: Listening on localhost:${room.rcvPort} to remote-end ${room.fwdHost}:${room.fwdPort}` )
            room = await this.getTcpListener(room)
            this.rooms.set(json.att.room.name,room)
            json.att.msg = 'ack'
            replyFn()
            return;
        }
        if ( room.fwdName == this.username){
            log.info(`${this.id} received ${room.name} config: Forwarding to ${room.fwdHost}:${room.fwdPort} from remote-end localhost:${room.rcvPort}` )
            room.connections = new Map()
            this.rooms.set(json.att.room.name,room)
            json.att.msg = 'ack'
            replyFn()
            return;            
        }
        replyFn()
    }

    async onCloseRoom (data,ReplyFn){
        let json = (new JSONData().setjson(data.json))
        let room = this.rooms.get(json.att.room.name)
        
        if (this.proxy){
            this.stopProxy()
        }

        // Disconnect TCP Connections, if present
        let connections = room.connections
        connections.forEach((connection)=>{
            if (connection && connection.tcpsocket) {
                connection.tcpsocket.destroy()
                connections.delete(connection.connectionID)            
            }                            
        })
        // Disconnect TCP Listener, if present
        if( room.tcpserver){
            log.debug(`${this.id}: Stopping listening on TCP port ${room.rcvPort}`);
            let closesrv = await new Promise((resolve, reject) => {
                room.tcpserver.close(()=>{
                    log.info(`${this.id}: Stopped listening on TCP port ${room.rcvPort}`);
                    room.tcpserver.unref()
                    resolve(true)
                })                   
            });
                     
        }
        this.rooms.delete(room.name)
        return ReplyFn()
    }

    async onStartProxy (data,replyFn){
        let json = (new JSONData().setjson(data.json))
        let proxyport = json.att.proxyport
        if ( parseFloat(proxyport) > 0 ){
            await this.startProxy(proxyport)            
        }
        replyFn(true)
    }

    async onStopProxy (data,replyFn){
        let json = (new JSONData().setjson(data.json))
        let room = json.att.room
        if ( room.rcvName == this.username){
            log.info(`${this.id} received ${room.name} config: Listening on localhost:${room.rcvPort} to remote-end ${room.fwdHost}:${room.fwdPort}` )
            room = await this.getTcpListener(room)
            this.rooms.set(json.att.room.name,room)
            json.att.msg = 'ack'
            replyFn()
            return;
        }
        if ( room.fwdName == this.username){
            log.info(`${this.id} received ${room.name} config: Forwarding to ${room.fwdHost}:${room.fwdPort} from remote-end localhost:${room.rcvPort}` )
            room.connections = new Map()
            this.rooms.set(json.att.room.name,room)
            json.att.msg = 'ack'
            replyFn()
            return;            
        }
        replyFn()
    }

    // Called by onClientConfig returns tcp listener(server) with room
    async getTcpListener(room){
        return new Promise((resolve, reject) => {

            room.connections = new Map()
            room.tcpserver = net.createServer((tcpsocket) => {
                this.rcvTcpConnRequest(room,tcpsocket)

            })

            room.tcpserver.listen(room.rcvPort, ()=> { //'listening' listener
                log.info(`${this.id}: Listening on TCP port ${room.rcvPort}`)
                resolve(room)
            })

        });  
    }

    // Called by onTcpConnRequest returns tcpsocket when outbound tcp connection is built
    async fwdTcpConnRequest(address,port,connection,room){
        let resolve, reject
        let reply = new Promise((res, rej) => { resolve = res; reject = rej });

        let socket = new net.Socket();
        let connectionStr = ""
        socket.connect(parseInt(port), address == "localproxy" ? "localhost" : address)
        socket.on("connect", (data)=>{
            connectionStr = `localhost:${socket.localPort.toString()} -> ${address}:${port}`
            log.info(`${this.id} Outgoing TCP: ${connectionStr}`)
            resolve(socket)
        });

        socket.on("close", (data)=>{
            log.info(`${this.id} TCP Forwarder Event:close for ${connectionStr}`)
            this.rcvTcpConnClose.call(this,room,connection.connectionID)
            // socket.destroy()
        });

        socket.on("drain", (data)=>{
            log.debug(`Event:drain for ${address}:${port}`)
            reject(socket)
        });

        socket.on("end", (data)=>{
            log.debug(`Event:end for ${address}:${port}`)
            reject(socket)
        });

        socket.on("error", (error)=>{
            if (!socket.destroyed){
                log.info(`${this.id} TCP Event:error ${error.message}`)
                reject(socket)                
            }
        });

        socket.on("timeout", (data)=>{
            log.info(`Event:timeout for ${address}:${port}`)
            reject(socket)
        });
        
        return reply
    } 

    // Sent by client to socket.io server to build a tcp-ws-bridge-ws-tcp 
    async rcvTcpConnRequest(room,tcpsocket){

        let connection = {}
        connection.tcpsocket = tcpsocket
        connection.localSrcIP = tcpsocket.remoteAddress.replace(/^.*:/, '')
        connection.localSrcPort = tcpsocket.remotePort.toString()
        connection.localDstPort = tcpsocket.localPort.toString()
        connection.id = this.socket.id + connection.localSrcPort + connection.localDstPort

        log.info(`${this.id} Incoming TCP: ${connection.localSrcIP}:${connection.localSrcPort} -> localhost:${connection.localDstPort}`)


        let json = new JSONData(this.username,"onTcpConnRequest",{})
        json.att.room = room.name
        json.att.connectionID = connection.id
        json.att.localSrcPort = connection.localSrcPort
        json.att.localDstPort = connection.localDstPort
        room.connections.set(connection.id,connection)  // Adding connection during request phase in case we need to clear the TCP socket


        this.socket.emit("onTcpConnRequest",json,(reply)=>{
            let replyJson = (new JSONData()).setjson(reply.json)
            if (replyJson.err){
                log.error(`${this.id} TCP CONNECTION REQUEST REJECT:`, replyJson.err)
                tcpsocket.destroy()
            }
            else{
                replyJson.att.connection.tcpsocket = tcpsocket
                room.connections.set(connection.id,replyJson.att.connection)   // Overwrite connection with final connection details
                
                let socket = this.socket
                let username = this.username;
                function myWrite (chunk, encoding, next) {
                    // log.debug(`${this.id} TCP data received:`,data.toString())
                    let json = { username: username, room:room.name, connectionId: connection.id, data: chunk}
                    socket.emit( "onData", json, ()=>{
                        next()
                    })
                }

                const { Writable } = require('stream');
                const myWritable = new Writable({ write: myWrite});
                tcpsocket.pipe(myWritable)                

                // tcpsocket.on('data', async (data)=>{
                //     log.debug(`${this.id} TCP data received:`,data.toString())
                //     let json = { username: this.username, room:room.name, connectionId: connection.id, data: data}
                //     this.socket.emit( "onData", json )
                // })
       
                tcpsocket.on("close", (data)=>{
                    log.info(`${this.id} TCP Listener Event:close for ${connection.localSrcIP}:${connection.localSrcPort} -> ${connection.localDstPort}`)
                    let o = this
                    this.rcvTcpConnClose.call(this,room.name,connection.id)
                    
                });
        
                tcpsocket.on("drain", (data)=>{
                    log.debug(`Event:drain for ${this.id}`)
                    
                });
        
                tcpsocket.on("end", (data)=>{
                    log.debug(`Event:end for ${this.id}`)
                    
                });
        
                tcpsocket.on("error", (data)=>{
                    log.info(`${this.id} TCP Event:error `)
                    
                });
        
                tcpsocket.on("lookup", (data)=>{
                    log.info(`Event:lookup for ${this.id}`)
                });
        
                tcpsocket.on("ready", (data)=>{
                    log.info(`Event:ready for ${this.id}`)
                    
                });
        
                tcpsocket.on("timeout", (data)=>{
                    log.info(`Event:timeout for ${this.id}`)
                    
                });
                        
            }
        })
 
    }

    // Event "onTcpConnRequest" socket.io server requests ws -> tcp connection
    async onTcpConnRequest(data,replyFn){
        log.debug(`${this.id} received onTcpConnRequest`)
        if (!data.json){
            return replyFn({json:{data:data,err:"invalid JSON received"}})
        }
        let json = (new JSONData()).setjson(data.json)

        this.fwdTcpConnRequest.call(this,json.att.connection.fwdHost, json.att.connection.fwdPort, json.att.connection, json.att.room)
        .then((tcpsocket)=>{
            //SUCCESS!! add connection to connections map
            json.att.connection.remoteSrcPort = tcpsocket.localPort
            json.att.connection.remoteDstPort = tcpsocket.remotePort
            let connection = JSON.parse(JSON.stringify(json.att.connection))
            connection.tcpsocket = tcpsocket;
            this.rooms.get(json.att.room).connections.set(json.att.connection.connectionID,connection)
            let jsonReply = new JSONData(this.username,"onTcpConnRequest",{msg:'ack',rnom: json.att.room ,connection:json.att.connection})

            let socket = this.socket
            let username = this.username;
            let room = json.att.room
            let connectionId = json.att.connection.connectionID
            function myWrite (chunk, encoding, next) {
                // log.debug(`${this.id} TCP data received:`,data.toString())
                let json = { username: username, room: room, connectionId: connectionId, data: chunk}
                socket.emit( "onData", json, ()=>{
                    next()
                })
            }
            const { Writable } = require('stream');
            const myWritable = new Writable({ write: myWrite});
            tcpsocket.pipe(myWritable)                
            replyFn(jsonReply)            

        })
        .catch((err)=>{
            let jsonReply = new JSONData(this.username,"onTcpConnRequest",{msg:'reject'})
            jsonReply.err = "TCP connection failed to build"
            replyFn(jsonReply)            
        })

    }

    // Fired by a TCP close event forwarded to server for notification
    async rcvTcpConnClose(roomName,connectionId){
        let room = this.rooms.get(roomName)
        if( room && room.connections){
            room.connections.delete(connectionId)
        }
        
        let json = new JSONData(this.username,"onTcpConnRequest",{})
        json.att.room = roomName
        json.att.connectionID = connectionId

        this.socket.emit("onTcpConnClose",json,(reply)=>{
            log.debug(`${this.id} connection close acknowledge room: ${roomName} ${connectionId}`)
        })
    }

    // Received by the server when the other end's TCP connection closes
    async onTcpConnClose(data,replyFn){
        let json = (new JSONData().setjson(data.json))
        log.debug(`${this.id} Received TCP Close form ${json.id}`)
        let room = this.rooms.get(json.att.room)
        if ( room && room.connections && room.connections.size){
            let connections = room.connections
            let connection = connections.get(json.att.connectionID)
            if (connection && connection.tcpsocket) {
                connection.tcpsocket.destroy()
                connections.delete(json.att.connectionID)            
            }            
        }



        // replyFn(json) // this is not needed
    }

    // Event when either the receiving or sending client receives data
    onData (json){
        log.silly(`${this.id} received data`)
        try {
            let connections = this.rooms.get(json.room).connections
            let connection = connections.get(json.connectionId)
            if (! connection){
                log.debug(`${this.id} invalid data received for non-existent connection (probably closed already..)`)
                return true
            }
            if ( this.username == connection.fwdName){
                connection.tcpsocket.write(json.data)
            }
            if ( this.username == connection.rcvName){
                connection.tcpsocket.write(json.data)
            }
                  
        } catch (error) {
            log.error(`${this.id} invalid data received`)
        }
        return true

    }

}


async function axioslogin( options ){
    let webuser = options.webuser
    let webpass = options.webpass
    let urlobj = new URL(options.url)
    let clientname = options.clientname
    let filename = options.filename ? options.filename : "token.json"   
    let URL_LOGIN = new URL(path.posix.join("/",urlobj.pathname,"login"),urlobj.href)
    let URL_TOKEN = new URL(path.posix.join("/",urlobj.pathname,"token"),urlobj.href)
    let user = {username: webuser, password: webpass}
    let client = { name: clientname}
    let axiosoptions = { jar: new tough.CookieJar() , withCredentials: true}
    return axios.post( URL_LOGIN.href, user, axiosoptions)
    .catch((err)=> { 
        let msg = `Login error with username: ${webuser} , ${err.message}`
        return Promise.reject( new Error(msg) )
    })
    .then((loginresult)=> { 
        if(!loginresult.data) {
            let msg = `Login failed with username: ${webuser}`
            return Promise.reject(new Error(msg))  
        } 
    })
    .then(()=> axios.post( URL_TOKEN.href, client, axiosoptions))
    .then((reply) => {
        let json = reply.data
        if (json.token){
            json.url = urlobj.href
            json.tokenfilecreated = new Date().toLocaleString();
            let file = new File(filename)
            return file.writeString(JSON.stringify(json))
        }else{
            return Promise.reject("no token found")
        }
    })
    .then(()=>{
        log.info(`Created ${filename}`)
    })
    .catch( err => { 
        log.error(err.message) 
    })
}


module.exports = SocketIoClient

if (require.main === module) {
    let json = {}
    var argv = require('minimist')(process.argv.slice(2));
    let filename = typeof argv._[0] === 'string' ? argv._[0] : "token.json"
    let webuser = "admin"
    let webpass = "admin"
    let url = "http://localhost:8080/"
    let clientname = "test"
    let input = false
    let tokenDownload = argv.t    
    if (process.env.RP_URL && process.env.RP_CLIENT && process.env.RP_TOKEN){
        json = {
            name: process.env.RP_CLIENT,
            token: process.env.RP_TOKEN,
            url: process.env.RP_URL,
        }
        Promise.resolve(new SocketIoClient(json.name,json.token,json.url) )
        .then( client => client.start() )
        .catch( error => {
        process.exit( console.log( "*****Execution Error*****\n", error ))
        })        
    }else if(tokenDownload){
        input      = process.env.RP_URL     ? process.env.RP_URL : readlineSync.question(`Enter url [${url}]: `);
        url        = input ? input : url
        input      = process.env.RP_WEBUSER ? process.env.RP_WEBUSER : readlineSync.question(`Enter username [${webuser}]: `);
        webuser    = input ? input : webuser
        input      = process.env.RP_WEBPASS ? process.env.RP_WEBPASS : readlineSync.question(`Enter password [*******]: `, {hideEchoBack: true});
        webpass    = input ? input : webpass
        input      = process.env.RP_CLIENT  ? process.env.RP_CLIENT : readlineSync.question(`Enter clientname [${clientname}]: `);
        clientname = input ? input : clientname
        let options = {
            url :url,
            webuser: webuser,
            webpass: webpass,
            clientname: clientname
        }
        axioslogin(options)
    }
    else{

        Promise.resolve( new File(filename) )
        .then( file   => file.readJson() )
        .catch(error  => process.exit( console.log( "Invalid configuration file token.json\n", error )))
        .then( json   => new SocketIoClient(json.name,json.token,json.url) )
        .then( client => client.start() )
        .catch( error => {
        process.exit( console.log( "*****Execution Error*****\n", error ))
        })
        
    }

}