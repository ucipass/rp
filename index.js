const SIO = require("./sioserver/sio-server.js")
const app = require("./manager/app.js")
const httpserver = require("./lib/httpserver.js")
// Socket.io Server default port PORT_MANAGER
sio = new SIO();
sio.start()
// Manager Server default port PORT_SIO
server = new httpserver({ app : app })
server.start()

