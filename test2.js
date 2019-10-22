let SERVER_PORT = 3333;
let CLIENT_PORT = 2222;
let numberOfConnections = 1;
let concurrency = true

let RP = require("./rp2.js")
let Client = require("./client.js")
let Echoserver = require("./echoserver.js")
let Echoclient = require("./echoclient.js")
let rp = new RP();
let client1 = new Client("client1");
let client2 = new Client("client2");
let echoserver = new Echoserver(SERVER_PORT) 

async function test(){
    try {
        await rp.start();
        await client1.start()
        await client2.start()
        await echoserver.start()
        let echoclient1 = new Echoclient(CLIENT_PORT);
        let echoclient2 = new Echoclient(CLIENT_PORT);
        echoclient1.send("ABCD")
        echoclient2.send("EFGH")

    } catch (error) {
        console.log(error)
    }
    return true
}

test()
.then((d)=>{
    console.log("Success")
    // echoserver.stop()
})
.catch((e)=>{
    console.log("Failure!!!",e)
})