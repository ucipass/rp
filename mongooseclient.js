"use strict";
const mongoose = require('mongoose')
mongoose.set('useCreateIndex', true);
const DATABASE_URL      = process.env.DATABASE_URL
const DATABASE_USERNAME = process.env.DATABASE_USERNAME
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD
const CollectionClients = 'Clients'
const CollectionWebusers = 'Webusers'

module.exports = function(){
    let options ={
        useUnifiedTopology: true,
        useNewUrlParser: true,
        user: DATABASE_USERNAME,
        pass: DATABASE_PASSWORD,                  
        auth:{
            authSource: 'admin'                    
        }
    }

    const connection  = mongoose.createConnection( DATABASE_URL, options);
    const ClientSchema = new mongoose.Schema({
        client: { type: String, required: true, unique: true },
        token: { type: String, required: true },
        ipaddr: { type: Date, required: false, default: Date.now },
        expiration: { type: Date, required: true, default: Date.now },
    });
    const Client = connection.model( CollectionClients, ClientSchema)

    const WebuserSchema = new mongoose.Schema({
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        expiration: { type: Date, required: true, default: Date.now },
    });
    const Webuser = connection.model( CollectionWebusers, WebuserSchema)

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

    return connection
}

