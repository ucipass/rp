"use strict";
var log = require("ucipass-logger")("mongooseclient")
log.transports.console.level = 'info'
const mongoose = require('mongoose')
mongoose.set('useCreateIndex', true);
const DATABASE_URL      = process.env.DATABASE_URL
const DATABASE_USERNAME = process.env.DATABASE_USERNAME
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD

const CollectionClients = 'Clients'
const CollectionWebusers = 'Webusers'
const CollectionRooms = 'Rooms'

const ClientSchema = new mongoose.Schema({
    client: { type: String, required: true, unique: true },
    token: { type: String, required: true },
    ipaddr: { type: Date, required: false, default: Date.now },
    expiration: { type: Date, required: true, default: Date.now },
});

const WebuserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    expiration: { type: Date, required: true, default: Date.now },
});

const RoomsSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    rcvName: { type: String, required: true, unique: false },
    rcvPort: { type: String, required: true, unique: false },
    fwdName: { type: String, required: true, unique: false },
    fwdHost: { type: String, required: true, unique: false },
    fwdPort: { type: String, required: true, unique: false },
    expiration: { type: Date, required: true, default: Date.now }
});

let options ={
    useUnifiedTopology: true,
    useNewUrlParser: true,
    user: DATABASE_USERNAME,
    pass: DATABASE_PASSWORD,                  
    auth:{
        authSource: 'admin'                    
    }
}

// CHECK IF ADMIN USER EXISTS IF NOT CREATE admin/admin
async function adminUserCheck(){
    const connection  = mongoose.createConnection( DATABASE_URL, options);
    const Webuser = connection.model( CollectionWebusers, WebuserSchema)
    Webuser.findOne({ "username" : "admin" })
    .then((user)=>{
        if(user){
            return true
        }else{
            let doc = new Webuser ({username: "admin", password: "admin"})
            log.info("Creating new admin user account!")
            return doc.save()  
        }
    })
    .then(()=>{
        return connection.close()
    })
    .catch((error)=>{
        log.error("Mongo DB error with admin user id",error)
    })    
}
adminUserCheck()

module.exports = function(){


    const connection  = mongoose.createConnection( DATABASE_URL, options);
    const Client  = connection.model( CollectionClients , ClientSchema )
    const Webuser = connection.model( CollectionWebusers, WebuserSchema)
    const Room = connection.model( CollectionRooms, RoomsSchema)

    connection.createClient = async (client)=>{
        return new Promise((resolve, reject) => {
            require('crypto').randomBytes(24, function(err, buffer) {
                if(err){
                    return(reject(err))
                }else{
                    return(resolve(buffer.toString('hex')))
                }
            });            
        })
        .then((token)=>{
            let doc = new Client ({client: client, token: token})
            return doc.save()              
        })                

    }

    connection.getClient = async (client)=>{
        return Client.findOne({ client : client})              
    }

    connection.getClients = async (client)=>{
        return Client.find({})              
    }

    connection.deleteClient = async (client)=>{
        return Client.deleteOne({ client : client})              
    }

    connection.verifyClient = async (client,token)=>{
        return connection.getClient(client)
        .then((clientObj)=>{
            if(clientObj && clientObj.client == client && clientObj.token == token){
                return true
            }
            else{
                return false
            }
        })                
    }

    connection.getWebuser = async (username)=>{
        let reply = await Webuser.findOne({ "username" : username})  
        return reply       
    }
    connection.deleteWebuser = async (username)=>{
        return Webuser.deleteOne({ username : username})                 
    }
    connection.createWebuser = async (username,password)=>{
        return new Promise((resolve, reject) => {
            require('crypto').randomBytes(24, function(err, buffer) {
                if(err){
                    return(reject(err))
                }else{
                    return(resolve(buffer.toString('hex')))
                }
            });            
        })
        .then((token)=>{
            let doc = new Webuser ({username: username, password: password})
            return doc.save()              
        })                

    }

    connection.getRooms = async ()=>{
        let rooms = await Room.find({}).sort({ name: 1 }).limit(1000)
        return rooms
    }
    connection.getRoom = async (room)=>{
        return Room.findOne({ name : room.name})       
    }
    connection.deleteRoom = async (room)=>{
        return Room.deleteOne({ name : room.name})                 
    }
    connection.updateRoom = async (room)=>{
        await Room.deleteOne({ name : room.name})      
        let doc = new Room (room)
        return doc.save()             
    }
    connection.createRoom = async (room)=>{
        let doc = new Room (room)
        return doc.save()              
    }

    return connection
}

