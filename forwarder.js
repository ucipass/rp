class Forwarder {
	constructor() {

	}

	start(){
		let resolve, reject
		let p = new Promise((res, rej) => { resolve =res ; reject = rej });


		var net = require('net')
		var websocket = require('websocket-stream')
		const REMOTE_PORT = "3333"
		const REMOTE_ADDR = "127.0.0.1"
		
		var ctrl = websocket('ws://localhost:3000/ctrl')
		console.log("STARTING FORWARDER")
		
		// ctrl.on('open', ()=>{ console.log("Control channel connected")  })
		
		ctrl.on('data', function(data) {
			//console.log("DEBUG RX:",data.toString())
				if( data.toString().includes("ServerControlPortOpen") ){
						console.log("CTRL RX:",data.toString())
						ctrl.write("ForwarderControlReady", ()=>{
							console.log("CTRL TX:", "ForwarderControlReady")
							console.log("Listening on Websocket ->",REMOTE_ADDR, REMOTE_PORT)
							resolve(true)
						})
			}
			if( data.toString().includes("ListenerReady") ){
				console.log("CTRL RX:",data.toString())
				forwarder(REMOTE_ADDR, REMOTE_PORT)
			}
		//        if( data.toString().includes("ControlBridgeOpen") ){
		//                console.log("CTRL RX:",data.toString())
		//		console.log("Ready to forward")
		//        }
		
		})
		
		ctrl.on('error', function(err) {
			if (err.errno == 'ECONNREFUSED') console.log("Websocket connection refused.")
			else console.log(err)
		})
		
		ctrl.on('finish', function(o) {
			console.log("Control channel to server is broken.")
			process.exit(1);
		})
		
		function forwarder(address,port){
			let ws = websocket('ws://localhost:3000/forwarder')
			let socket = new net.Socket();
			socket.connect(parseInt(port), address, function () {
				console.log('CONNECT: Websocket ->', address, port);
				ws.pipe(socket)
				socket.pipe(ws)
				ctrl.write("ForwarderReady", ()=>{
					console.log('CTRL TX: ForwarderReady');
				})
			})
			socket.on('end', function() {
				console.log('DISCONNECT: Websocket ->', address, port);
				ws.destroy();
			  });
		}
		





		return p;
	}  
}
  
  
module.exports = Forwarder
