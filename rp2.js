class RP {
    
    constructor() {
        this.rooms = []
        this.defaultRoom = {
            name: "default",
            members: [
                {
                    name: "client1",
                    listener: {
                        srcPort: 2222
                    },
                    forwarder: null
                },
                {
                    name: "client2",
                    listener: null,
                    forwarder: {
                        dstPort: 3333,
                        dstIP: "127.0.0.1"
                    }
                }
            ],
            activeMember: [],
            connections: []
        }
	}
	
	start(){
        this.setupRoom()
		let resolve, reject
		let p = new Promise((res, rej) => { resolve =res ; reject = rej });
		const express = require('express');
		const expressWebSocket = require('express-ws');
		const websocketStream = require('websocket-stream/stream');
        const app = express();
        const JSONData = require('./jsondata.js')

        //******************************************/
        // CONTROL WEBSOCKET
        //******************************************/
		expressWebSocket(app, null, {    perMessageDeflate: false, });
		app.ws('/ctrl', (ws, req) =>{
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

            wsctrl.on('end', function () {
                // This may not been called since we are destroying the stream
                // the first time 'data' event is received
                console.log('RP: stream end data in the file has been read');
            })

            wsctrl.on('close', function (err) {
                console.log('RP: stream has been destroyed and file has been closed');
            });


        })

		app.ws('/data*', (ws, req) =>{
            let room = null
            this.rooms.forEach((room)=>{
                room.connections.forEach((connection)=>{
                    if( req.url.search(connection.wsForwarder.wsName) > 0 ){
                        console.log(connection.wsForwarder.wsName)
                        connection.wsForwarder.stream = websocketStream(ws, {    binary: true,  });
                        connection.wsForwarder.stream.on('end', function () {
                            console.log(`RP: ${connection.wsForwarder.wsName} end data in the file has been read`);
                        })
                        connection.wsForwarder.stream.on('close', function (err) {
                            console.log(`RP: ${connection.wsForwarder.wsName} has been destroyed and file has been closed`);
                        });                        
                        this.dataStreamHandler(connection)
                    }
                    if( req.url.search(connection.wsListener.wsName) > 0 ){
                        console.log(connection.wsListener.wsName)
                        connection.wsListener.stream  = websocketStream(ws, {    binary: true,  });
                        //connection.wsListener.stream.on("data",(d)=>{console.log("Listener",d.toString())})
                        connection.wsListener.stream.on('end', function () {
                            console.log(`RP: ${connection.wsListener.wsName} end data in the file has been read`);
                        })
                        connection.wsListener.stream.on('close', function (err) {
                            console.log(`RP: ${connection.wsListener.wsName} has been destroyed and file has been closed`);
                        });   
                        this.dataStreamHandler(connection)
                    }
                })
            })
        })

        var server = app.listen(3000, function (){
			var host = server.address().address;
			var port = server.address().port;
			console.log('RP: Rendezvous Point started at http://%s:%s', host, port);
			resolve(true)
        });

        return p;
    }

    dataStreamHandler(connection){
        if(connection.wsListener.stream && connection.wsForwarder.stream){
            connection.wsListener.stream.pipe(connection.wsForwarder.stream)
            connection.wsForwarder.stream.pipe(connection.wsListener.stream)
        }else{
            console.log(`RP: Waiting for other WS connection for tunnel to be coupled`)
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
            console.log("RP: startTunnel sent to", fmember.name)
        })
        let lmember = this.findClientMember(jsondata.att.connection.wsListener.clientName)
        lmember.ctrl.write(jsondata.toString(),()=>{
            console.log("RP: startTunnel sent to", lmember.name)
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

    setupRoom(){
        this.rooms.push(this.defaultRoom)
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