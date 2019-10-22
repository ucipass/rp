class RP {
    
    constructor() {

	}
	
	start(){
		let resolve, reject
		let p = new Promise((res, rej) => { resolve =res ; reject = rej });
		const stream = require('stream');
		const express = require('express');
		const expressWebSocket = require('express-ws');
		const websocketStream = require('websocket-stream/stream');
		const app = express();
		var stream1,stream2,streamtr
		var connection = false;
		var listenerControl = false;
		var forwarderControl = false;
		
		var ctrl = new stream.Readable({  }); // Hub for all control messages
		ctrl._read = () => {}
		
		expressWebSocket(app, null, {    perMessageDeflate: false, });
		
		app.ws('/ctrl', function(ws, req) {
			let wsctrl = websocketStream(ws, {    binary: true,  });
			wsctrl.write("ServerControlPortOpen",()=>{})
			wsctrl.on("data",(data)=>{
				ctrl.push(data)
				if( data.toString().includes("ListenerControlReady") ){
					console.log("CTRL RX:",data.toString())
					listenerControl = true
				}
				if( data.toString().includes("ForwarderControlReady") ){
					console.log("CTRL RX:",data.toString())
					forwarderControl = true
				}
			})
			ctrl.pipe(wsctrl)
		
			//wsctrl.write("BridgeOpen",()=>{
			//	console.log("Bridge Open.")
			//})
		});
		
		
		app.ws('/forwarder', function(ws, req) {
		  stream1 = websocketStream(ws, {
			binary: true,
		  });
		  stream1.on('finish', function(){
			console.log("Forwarder stopped");
			stream1 = null;
		  });
		  console.log("Forwarder sata socket connected.")
		  connect()
		});
		
		app.ws('/listener', function(ws, req) {
		  stream2 = websocketStream(ws, {    binary: true,  });
		  stream2.on('finish', function(){
			console.log("Listener stopped");
			stream2 = null;
		  });
		  console.log("Listener data socket connected.")
		  connect()
		});
		
		
		function connect(){
		  if (stream1 && stream2){
			  stream1.pipe(stream2)
			stream2.pipe(stream1)
		  }else{
			  //console.log("Waiting for both sides.")
		  }
		
		}

		var server = app.listen(3000, function (){
			var host = server.address().address;
			var port = server.address().port;
			console.log('Rendezvous Point started at http://%s:%s', host, port);
			resolve(true)
		});


		// let sio = require('socket.io')(server)
		// let clients = []
		// sio.on('connection', (socket) => {
		// 	clients.push(socket)
		// 	let lastSocket = socket.id
		// 	let user = socket.user
		// 	let auth = socket.auth
		// 	log.info('Socket.io user connected',socket.id);
		// 	socket.on('disconnect', ()=>{
		// 		log.info('Socket.io user disconnected id:',lastSocket);
		// 	})

		// 	socket.on('echo', ( msg , callback )=>{
		// 		try{
		// 			log.debug("Socket.io echo recevied from",socket.id)
		// 			callback(msg)
		// 		}catch(e){
		// 			log.error("Socket.io error with sending reply on echo")
		// 		}
		// 	});
		// 	socket.on('data', ( msg , callback )=>{
		// 		if(auth){
		// 			console.log("Reply data", new Date())
		// 			callback("Reply data")
		// 		}else{
		// 			console.log("Not Authenticated")
		// 			callback(false)
		// 		}
		// 	});			
		// })






		return p;
		
	}
}

module.exports = RP;