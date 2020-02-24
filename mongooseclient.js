"use strict";
var log = require("ucipass-logger")("mongooseclient")
log.transports.console.level = 'info'
const mongoose = require('mongoose')
mongoose.set('useCreateIndex', true);
const DATABASE_URL      = process.env.DATABASE_URL ? process.env.DATABASE_URL : "mongodb://localhost:27017/rp"
const DATABASE_USERNAME = process.env.DATABASE_USERNAME ? process.env.DATABASE_USERNAME : "admin"
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD ? process.env.DATABASE_USERNAME : "admin"

const CollectionClients = 'Clients'
const CollectionWebusers = 'Webusers'
const CollectionRooms = 'Rooms'

const ClientSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    token: { type: String, required: true },
    ipaddr: { type: String, required: false, default: "0.0.0.0/0" },
    proxyport: { type: String, required: false, default: "0" },
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
    useFindAndModify: false,
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
        let token = await new Promise((resolve, reject) => {
            require('crypto').randomBytes(24, function(err, buffer) {
                if(err){
                    return(reject(err))
                }else{
                    return(resolve(buffer.toString('hex')))
                }
            });            
        })

        if(typeof client === 'object' && client !== null){
            client.token = client.token ? client.token : token
            let doc = new Client (client)
            return doc.save() 
        }
        else{
                let doc = new Client ({name: client, token: token})
                return doc.save()              
        }
           

    }

    connection.getClient = async (client)=>{
        return Client.findOne({ name : client})              
    }

    connection.getClients = async (client)=>{
        return Client.find({})              
    }

    connection.deleteClient = async (client)=>{



        if(typeof client === 'object' && client !== null){
            return Client.deleteOne({ name : client.name})  
        }
        else{
            return Client.deleteOne({ name : client})  
        }        
                    
    }

    connection.verifyClient = async (client,token)=>{
        return connection.getClient(client)
        .then((clientObj)=>{
            if(clientObj && clientObj.name == client && clientObj.token == token){
                return true
            }
            else{
                return false
            }
        })                
    }

    connection.updateClient = async (clientobj)=>{
        var query = { name: clientobj.name };
        let newclientobj = await Client.findOneAndUpdate(query, clientobj)
        return newclientobj;
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

