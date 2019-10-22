let SERVER_PORT = 3333;
let CLIENT_PORT = 2222;
let numberOfConnections = 1;
let concurrency = true

let RP = require("./rp.js")
let rp = new RP();
let Listener = require("./listener.js")
let listener = new Listener();
let Forwarder = require("./forwarder.js")
let forwarder = new Forwarder();
let Echoserver = require("./echoserver.js")
let echoserver = new Echoserver(SERVER_PORT)
let Echoclient = require("./echoclient.js")

async function test(){
    // let RP = require("./rp2.js")
    await rp.start();
    await listener.start()
    await forwarder.start()
    await echoserver.start()
    try {
        let echoclient = new Echoclient(CLIENT_PORT);
        await echoclient.send("ABCD")
        // echoclient = new Echoclient(CLIENT_PORT);
        // await echoclient.send("EFGH")

    } catch (error) {
        console.log(error)
    }
    

    return true
}
test()
.then((d)=>{
    echoserver.stop()
})
.catch((e)=>{
    console.log("Failure!!!")
})