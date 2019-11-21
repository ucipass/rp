const server = require("./server.js")
const Client = require("./client.js")

async function run(){
    let client1 = new Client("client1");
    let client2 = new Client("client2");

    // comment out whicever component needed test
    await server.started;
    await client1.start()
    await client2.start()
}

run()