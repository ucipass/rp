const expect = require('expect');
const Echoserver = require("../echoserver.js")
const Echoclient = require("../echoclient.js")
const RP = require("../rp.js")
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
        let SERVER_PORT = 3333;
        let CLIENT_PORT = 2222;

        let room = {
            name: "default",
            members: [
                {
                    name: "client1",
                    listener: {
                        srcPort: CLIENT_PORT
                    },
                    forwarder: null
                },
                {
                    name: "client2",
                    listener: null,
                    forwarder: {
                        dstPort: SERVER_PORT,
                        dstIP: "127.0.0.1"
                    }
                }
            ],
            activeMember: [],
            connections: []
        }
        let rp = new RP(room);
        let client1 = new Client("client1");
        let client2 = new Client("client2");
        await rp.start();
        await client1.start()
        await client2.start()
        let echoserver = new Echoserver(SERVER_PORT)    
        await echoserver.start()
        let echoclient1 = new Echoclient(CLIENT_PORT);
        let echoclient2 = new Echoclient(CLIENT_PORT);
        let r1 =  await echoclient1.send("ABCD")
        let r2 =  await echoclient2.send("EFGH")
        await echoserver.stop()
        await client1.stop();
        await client2.stop();
        await rp.stop();
        expect(r1).toEqual("ABCD");
        expect(r2).toEqual("EFGH");
    });
  });