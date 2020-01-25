"use strict";
const mongoose = require('mongoose')
mongoose.set('useCreateIndex', true);
const DATABASE_URL      = process.env.DATABASE_URL
const DATABASE_USERNAME = process.env.DATABASE_USERNAME
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD
const COLLECTION = 'Clients'

module.exports = async function(){
    let options ={
        useUnifiedTopology: true,
        useNewUrlParser: true,
        user: DATABASE_USERNAME,
        pass: DATABASE_PASSWORD,                  
        auth:{
            authSource: 'admin'                    
        }
    }

    const connection  = await mongoose.createConnection( DATABASE_URL, options);
    const ClientSchema = new mongoose.Schema({
        client: { type: String, required: true, unique: true },
        token: { type: String, required: true },
        expiration: { type: Date, required: true, default: Date.now }
    });
    const Client = connection.model( COLLECTION, ClientSchema)

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

    return connection
}

