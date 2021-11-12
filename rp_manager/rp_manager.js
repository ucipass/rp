const app = require("./app.js")
const httpserver = require("../lib/httpserver.js")
const port = process.env.PORT ? process.env.PORT : 80
const server = new httpserver( {app:app, port:port})
server.start()
.catch((error)=>{
    console.log("Failed to start manager")
})