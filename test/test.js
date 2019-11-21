const expect = require('expect');
const fs = require('fs');
const Echoserver = require("./echoserver.js")
const Echoclient = require("./echoclient.js")
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
        let CLIENT_PORT = 3331
        let SERVER_PORT = 4441
        let SERVER_ADDR = "localhost"
        let oldroom = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        let newroom = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        newroom.members[0].listener.srcPort = CLIENT_PORT
        newroom.members[1].forwarder.dstPort = SERVER_PORT
        newroom.members[1].forwarder.dstIP = SERVER_ADDR
        fs.writeFileSync("config.json", JSON.stringify(newroom,null,2), 'utf8')
        
        let client1 = new Client("client1");
        let client2 = new Client("client2");

        const server = require("../server.js")
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
        fs.writeFileSync("config.json", JSON.stringify(oldroom,null,2), 'utf8')
        expect(reply1).toEqual("ABCD");
        expect(reply2).toEqual("EFGH");
    });
  });