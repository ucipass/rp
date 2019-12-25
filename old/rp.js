const fs = require('fs');
class RP  {
    constructor(app) {
        this.rooms = []
        this.app = app
        this.lastSocketKey = 0;
        this.socketMap = {};
	}
	
	async start(){
        this.rooms.push( JSON.parse(fs.readFileSync('config.json', 'utf8')) )
        //******************************************/
        // WEBSOCKET CONTROL CHANNELS
        //******************************************/
        const expressWebSocket = require('express-ws');
        expressWebSocket(this.app, null, { perMessageDeflate: false, });
        
        const websocketStream = require('websocket-stream/stream');
        const JSONData = require('../jsondata.js')
 
		this.app.ws('/rp/ctrl', (ws, req) =>{
			let wsctrl = websocketStream(ws, {    binary: true,  });
			wsctrl.on("data",(data)=>{
                let jsondata = new JSONData()
                jsondata.fromString(data)
                let room = this.findClientRoom(jsondata.id)

                // REGISTRATION
                if( jsondata.type == "registration" ){
                    jsondata.type = "registrationReply"
                    if (this.register(jsondata)){
                        wsctrl.write(jsondata.toString(),()=>{
                            console.log("RP:", jsondata.id, "registration successful")
                        })
                        let member = this.findClientMember(jsondata.id)
                        member.ctrl = wsctrl;
                    }else{
                        console.log("RP:", jsondata.id, "registration NOT successful")
                        jsondata.att.room = null
                        wsctrl.write(jsondata.toString(),()=>{
                            wsctrl.destroy();
                        })
                    }
                }

                // CONNECTION REQUEST
                if( jsondata.type == "connectionRequest" ){
                    console.log(`RP: Connection request received from ${jsondata.id} for connection: ${jsondata.att.connection.wsListener.wsName}`)
                    let member = room.members.find((member) => member.name != jsondata.id) //pick other member info from room
                    if (member){
                        jsondata.att.connection.room = room.name
                        jsondata.type = "connectionForward"
                        member.ctrl.write(jsondata.toString(),()=>{
                            console.log(`RP: Connection request forwarded to ${member.name} for connection: ${jsondata.att.name}`)
                        })                        
                    }
                    else{
                        console.log(`RP: Connection request forwarded to ${member.name} denied for connection: ${jsondata.att.name}`)
                    }     
                }

                // CONNECTION FORWARD REPLY
                if( jsondata.type == "connectionForwardReply" ){
                    console.log(`RP: connectionForwardReply request received from ${jsondata.id} for connection: ${jsondata.att.name}`)
                    this.startTunnel(jsondata)
                }

            })

            wsctrl.on('end', () => {
                // This may not been called since we are destroying the stream
                // the first time 'data' event is received
                console.log('RP: End Websocket Control Channel');
            })

            wsctrl.on('close', () => {
                console.log('RP: Close Websocket Control Channel');
            });
        })

        //******************************************/
        // WEBSOCKET DATA CHANNELS
        //******************************************/
		this.app.ws('/rp/data*', (ws, req) =>{
            let room = null
            this.rooms.forEach((room)=>{
                room.connections.forEach((connection)=>{
                    if( req.url.search(connection.wsForwarder.wsName) > 0 ){
                        console.log(connection.wsForwarder.wsName)
                        connection.wsForwarder.stream = websocketStream(ws, {    binary: true,  });
                        connection.wsForwarder.stream.on('end', function () {
                            console.log(`RP: End data channel ${connection.wsForwarder.wsName}`);
                        })
                        connection.wsForwarder.stream.on('close', function (err) {
                            console.log(`RP: Close data channel ${connection.wsForwarder.wsName}`);
                        });                        
                        this.dataStreamHandler(connection)
                    }
                    if( req.url.search(connection.wsListener.wsName) > 0 ){
                        console.log(connection.wsListener.wsName)
                        connection.wsListener.stream  = websocketStream(ws, {    binary: true,  });
                        //connection.wsListener.stream.on("data",(d)=>{console.log("Listener",d.toString())})
                        connection.wsListener.stream.on('end', function () {
                            console.log(`RP: End data channel ${connection.wsListener.wsName}`);
                        })
                        connection.wsListener.stream.on('close', function (err) {
                            console.log(`RP: Close data channel ${connection.wsListener.wsName}`);
                        });   
                        this.dataStreamHandler(connection)
                    }
                })
            })
        })


    }

    dataStreamHandler(connection){
        if(connection.wsListener.stream && connection.wsForwarder.stream){
            connection.wsListener.stream.pipe(connection.wsForwarder.stream)
            connection.wsForwarder.stream.pipe(connection.wsListener.stream)
            console.log(`RP: Tunnel UP ${connection.wsListener.wsName} <-> ${connection.wsForwarder.wsName}`)
        }else{
            // console.log(`RP: Waiting for other WS connection for tunnel to be coupled`)
        }
    }

    startTunnel(jsondata){
        let connection = jsondata.att.connection
        this.rooms.forEach((room)=>{ 
            if(room.name == connection.room) room.connections.push(connection)
        })
        jsondata.type = "startTunnel"
        let fmember = this.findClientMember(jsondata.att.connection.wsForwarder.clientName)
        fmember.ctrl.write(jsondata.toString(),()=>{
            // console.log("RP: startTunnel sent to", fmember.name)
        })
        let lmember = this.findClientMember(jsondata.att.connection.wsListener.clientName)
        lmember.ctrl.write(jsondata.toString(),()=>{
            // console.log("RP: startTunnel sent to", lmember.name)
        })
    }

    register (jsondata){
        let clientName = jsondata.id
        // see if client is allowed in room
        let room = this.findClientRoom(clientName)
        if (room){
            room.activeMember.push(clientName)
            jsondata.att.room = room
            return(true)
        } 
        else {
            jsondata.room = null;
            return(false)
        }
    }

    findClientRoom(clientName){
        // find room with clientName
        return this.rooms.find((room)=>{
            let found = false
            room.members.forEach(member => {
                if (member.name == clientName) found = true
            });
            return found
        })
    }

    findClientMember(clientName){
        let member = null
        let room = this.findClientRoom(clientName)
        member = room.members.find((member) => member.name == clientName) //pick member info from room
        return member
    }
}

module.exports = RP

if (require.main === module) {

    let rp = new RP()
    rp.start()    

    }

