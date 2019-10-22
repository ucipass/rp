class LISTENER {
    
  constructor() {
    let controlOpen = false
  }

	start(){
		let resolve, reject
    let p = new Promise((res, rej) => { resolve =res ; reject = rej });
    // import io from 'socket.io-client';
    var websocket = require('websocket-stream')
    var net = require('net');
    var ctrl = websocket('ws://localhost:3000/ctrl')
    ctrl.on('open', ()=>{ console.log("Control channel connected")  })
    
    const PORT = 2222
    //process.stdin.pipe(ws)
    //ws.pipe(process.stdout)
    //ws.on('data', function(o) {
    //    console.log(o.toString(),'got hello back')
    //  })
    
    var res,rej
    
    console.log("STARTING LISTENER")
    
    ctrl.on("data",(data)=>{
      //console.log("DEBUG RX:",data.toString())
      if( data.toString().includes("ServerControlPortOpen") ){
        console.log("CTRL RX:",data.toString())
        ctrl.write("ListenerControlReady", ()=>{
          console.log("CTRL TX:", "ListenerControlReady")
          resolve(true)
          listener(PORT)
        })
            }
    //        if( data.toString().includes("ForwarderControlReady") ){
    //		console.log("CTRL RX:",data.toString())
    //        }
    //        if( data.toString().includes("ControlBridgeOpen") ){
    //		console.log("CTRL RX:",data.toString())
    //		listener(PORT);
    //      }
            if( data.toString().includes("ForwarderReady") ){
        console.log("CTRL RX:",data.toString())
        res(true)
            }
    })
    
    ctrl.on('error', function(err) {
            if (err.errno == 'ECONNREFUSED') console.log("Websocket connection refused")
            else console.log(err)
    })
    
    ctrl.on('finish', function(o) {
            console.log("Control channel to server is broken.")
            process.exit(1);
    })
    
    function listener(port){
      var server = net.createServer(function(c) { //'connection' listener
        var ws = websocket('ws://localhost:3000/listener')
        console.log('CONNECT: TCP port',port,' -> Websocket');
        ctrl.write("ListenerReady", ()=>{
          console.log("CTRL TX: ListenerReady")
          let ready = new Promise(function(resolve, reject){ res=resolve;rej=reject})
          ready.then(()=>{
            //console.log("Tunnel Ready.")
            c.pipe(ws);
            ws.pipe(c);
          })
        })
        c.on('end', function() {
          console.log('DISCONNECT: TCP port',port,' -> Websocket');
          ws.destroy();
        });
      });
    
      server.listen(port, function() { //'listening' listener
        console.log('Listening on TCP port:', port);
      });
    
    
    }




    return p;
  }  

  sio(url){
    // let resolve,reject
    // let p = new Promise((res,rej)=>{resolve = res; reject = rej})
    // let lastSocketID = null
    // let socket = io.connect(url, {reconnect: true});
    // socket.on('connect', async function () {
    //     let authenticated = await checkLogin()
    //     console.log("socket.io auth status", authenticated ? true :false , lastSocketID=socket.id);
    //     if (document && document.body){
    //         document.body.setAttribute("data-sio", "connected");
    //     }
    //     resolve(authenticated)
    // });
    // socket.on('disconnect', function () { 
    //     console.log("socket.io client disconnected", lastSocketID);
    //     if (document && document.body){ 
    //         document.body.setAttribute("data-sio", "disconnected");
    //     }
    // });
    // //postauth("test","test")
    // return p
  }




}


module.exports = LISTENER