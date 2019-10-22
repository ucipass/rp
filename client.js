const JSONData = require('./jsondata.js')
const net = require('net')
const websocket = require('websocket-stream')

class Client {
    
  constructor(clientName,url) {
    this.url = url ? url : 'ws://localhost:3000/rp'
    this.room = null
    this.connections = []
    this.clientName = clientName;
    this.ctrl = null
  }

	start() {
		let resolve, reject
    let p = new Promise((res, rej) => { resolve =res ; reject = rej });
    // import io from 'socket.io-client';
    var net = require('net');
    const PORT = 2222
    const registration = new JSONData(this.clientName,"registration",{})
    var res,rej

    // Send initial registration to RP and receive 'room' info
    let url = this.url+"/ctrl"
    let ctrl = websocket(url)
    this.ctrl = ctrl;
    ctrl.write( registration.toString(), ()=> {
      console.log(`${ this.clientName }: Registration Sent`) 
    })
    ctrl.on("data", async (data)=>{
        let jsondata = new JSONData()
        jsondata.fromString(data)

        // Registration Reply handling
        if( jsondata.type == "registrationReply" ){
          this.room = jsondata.att.room
          if (this.room){
            let member = this.room.members.find((member) => member.name == this.clientName) //pick member info from room
            if(member.listener) { 
              await this.listener(member.listener.srcPort) // start tcp service(s) on port(s)
            }
            if(member.forwarder) { 
              console.log(`${this.clientName}: Forwarding to ${member.forwarder.dstIP} port ${member.forwarder.dstPort}`) 
            }
            console.log(`${this.clientName}: Registration complete`)
            resolve(`${this.clientName}: Registration complete`)
          }
          else{
            console.log(`${this.clientName}: Registration refused`)
            ctrl.destroy();
            reject(`${this.clientName}: Registration refused`)
          }
        }

        if( jsondata.type == "connectionForward" ){
          let member = this.room.members.find((member) => member.name == this.clientName) //pick member info from room
          console.log(`${member.name}: received connectionForward for ${member.forwarder.dstIP} port ${member.forwarder.dstPort}`)
          this.forwarder(jsondata)

        }

        if( jsondata.type == "startTunnel" ){
         this.startTunnel(jsondata)
        }

    })

    ctrl.on('end', () => {
      // This may not been called since we are destroying the stream
      // the first time 'data' event is received
      console.log(`${this.clientName}: End websocket control channel`);
  })

    ctrl.on('finish', (o) => {
      console.log(`${this.clientName}: Finish websocket control channel`);
      // process.exit(1);
    })

    ctrl.on('error', (err) => {
      if (err.errno == 'ECONNREFUSED') console.log(`${this.clientName}: Websocket connection refused.`); 
      else console.log(`${this.clientName}: UNKNOWN ERROR:`,err); 
    })
    
    return p;
  }  

  listener(port){
    return new Promise((resolve, reject) => {
      var server = net.createServer( (c) => { //'connection' listener
        c.on('end', () => {
          console.log(`${this.clientName}: End localhost:${port} -> Websocket`);
          // ws.destroy();
        });
        let connection = {
          tcpListener: {
            clientName: this.clientName,
            remotePort: c.remotePort.toString(),
            localPort: c.localPort.toString(),
            socket: c            
          },
          wsListener: {
            clientName: this.clientName,
            wsName: this.clientName+"RemotePort"+c.remotePort.toString()+"LocalPort"+c.localPort.toString()
          }
        }
        //c.on("data",(d)=>{console.log("Listener",d.toString())})
        this.connections.push(connection)
        let req = new JSONData(this.clientName,"connectionRequest",{ name: connection.wsListener.wsName, connection: connection})
        this.ctrl.write( req.toString(), ()=> {
          console.log(`${this.clientName}: initializing websocket for port ${connection.wsListener.wsName}`)
        })

      });
    
      server.listen(port, ()=> { //'listening' listener
        console.log(`${this.clientName}: Listening on port ${port}`)
        resolve(true)
      });
        
    });  
  }

  forwarder(jsondata){
    return new Promise((resolve, reject) => {
      // let ws = websocket('ws://localhost:3000/forwarder')
      let remoteConnection = jsondata.att.connection
      let member = this.findClientMember(this.clientName)
      let port = member.forwarder.dstPort
      let address = member.forwarder.dstIP
      let socket = new net.Socket();
      socket.connect(parseInt(port), address, () => {
        console.log('CONNECT: Websocket ->', address, port);
        remoteConnection.wsForwarder = {
          clientName: this.clientName,
          wsName: this.clientName+"LocalPort"+socket.localPort.toString()+"RemotePort"+socket.remotePort.toString()
        }
        remoteConnection.tcpForwarder = {
          clientName: this.clientName,
          remotePort: socket.remotePort.toString(),
          localPort: socket.localPort.toString(),
          socket: socket          
        }
        let connection = {}
        connection.wsForwarder = {
          clientName: this.clientName,
          wsName: this.clientName+"LocalPort"+socket.localPort.toString()+"RemotePort"+socket.remotePort.toString()
        }
        connection.tcpForwarder = {
          clientName: this.clientName,
          remotePort: socket.remotePort.toString(),
          localPort: socket.localPort.toString(),
          socket: socket          
        }
        this.connections.push(connection)
        let req = new JSONData(this.clientName,"connectionForwardReply",{ name: remoteConnection.wsForwarder.wsName, connection: remoteConnection})
        this.ctrl.write( req.toString(), ()=> {
          console.log(`${this.clientName}: connectionForwardReply ${remoteConnection.wsForwarder.wsName}`)
          resolve(`${this.clientName}: connectionForwardReply ${remoteConnection.wsForwarder.wsName}`)
        })
      })

      socket.on('end', () => {
        console.log(`${this.clientName}: Disconnected Websocket -> ${address}:${port}`);
        // ws.destroy();
      }); 
    });
  }

  startTunnel(jsondata){
    let wsConnection = null
    let tcpConnection = null
    this.connections.forEach((con) => {
      if (con.wsForwarder && con.wsForwarder.wsName == jsondata.att.connection.wsForwarder.wsName){
        wsConnection = con.wsForwarder
        tcpConnection = con.tcpForwarder
      }
      if (con.wsListener && con.wsListener.wsName == jsondata.att.connection.wsListener.wsName){
        wsConnection = con.wsListener
        tcpConnection = con.tcpListener
      }
    })
    let url = this.url+'/data/'+ wsConnection.wsName
    wsConnection.stream = websocket(url)

    wsConnection.stream.on('end', () => {
      // This may not been called since we are destroying the stream
      // the first time 'data' event is received
      console.log(`${this.clientName}: End ${url}`);
    })

    wsConnection.stream.on('finish', (o) => {
      console.log(`${this.clientName}: Finish ${url}`);
    })

    wsConnection.stream.on('error', (err) => {
      if (err.errno == 'ECONNREFUSED') console.log(`${this.clientName}: Websocket connection refused.${url}`); 
      else console.log(`${this.clientName}: UNKNOWN ERROR:${url}`,err); 
      console.log(err)
    })
    //tcpConnection.socket.on("data",(d)=>{console.log("Listener",d.toString())})
    tcpConnection.socket.pipe(wsConnection.stream)
    wsConnection.stream.pipe(tcpConnection.socket)

  }

  connectionForwardReply(conn){
    let req = new JSONData(this.clientName,"connectionForwardReply",{ name: conn.name})
    this.ctrl.write( req.toString(), ()=> {
      console.log(`${this.clientName}: connectionForwardReply ${conn.name}`)
    })
  }

  findClientMember(clientName){
      let member = null
      member = this.room.members.find((member) => member.name == clientName) //pick member info from room
      return member
  }
}

module.exports = Client

if (require.main === module) {
  var argv = require('minimist')(process.argv.slice(2));
  if ( argv.c ){
    let client = new Client(argv.c ? argv.c : "ws://127.0.0.1:3000",argv.u)
    client.start()
  }else{
    console.log( "need -c for clientName and -u for url")
  }
}