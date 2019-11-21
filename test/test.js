const expect = require('expect');
const fs = require('fs');
const Echoserver = require("../echoserver.js")
const Echoclient = require("../echoclient.js")
const server = require("../server.js")
const Client = require("../client.js")

describe('simple get request', () => {
    it('Echo Server Test', async () => {

        let SERVER_PORT = 3333;
        let echoserver = new Echoserver(SERVER_PORT) 
        let echoclient1 = new Echoclient(SERVER_PORT);
        let echoclient2 = new Echoclient(SERVER_PORT);
        await echoserver.start()
        let r1 =  await echoclient1.send("ABCD")
        let r2 =  await echoclient2.send("EFGH")
        await echoserver.stop()
        expect(r1).toEqual("ABCD");
        expect(r2).toEqual("EFGH");

    });

    it('Basic Test1', async () => {
        let room = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        let CLIENT_PORT = room.members[0].listener.srcPort;
        let SERVER_PORT = room.members[1].forwarder.dstPort;
        let client1 = new Client("client1");
        let client2 = new Client("client2");

        await server.started;
        await client1.start()
        await client2.start()
        let echoserver = new Echoserver(SERVER_PORT)    
        await echoserver.start()
        
        let echoclient1 = new Echoclient(CLIENT_PORT);
        let echoclient2 = new Echoclient(CLIENT_PORT);
        let reply1 =  await echoclient1.send("ABCD")
        let reply2 =  await echoclient2.send("EFGH")
        
        await echoserver.stop()
        await client1.stop();
        await client2.stop();
        await server.stop();
        expect(reply1).toEqual("ABCD");
        expect(reply2).toEqual("EFGH");
    });
  });