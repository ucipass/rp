const SIO = require("./sioserver/sio-server.js")
const app = require("./manager/app.js")
const httpserver = require("./lib/httpserver.js")
// Socket.io Server default port process.env.SIO_PORT
sio = new SIO();
sio.start()
// Manager Server default port PORT_MANAGER
server = new httpserver({ app : app , port: process.env.MANAGER_PORT})
server.start()

