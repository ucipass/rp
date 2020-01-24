const MongoClient = require('mongodb').MongoClient;
const log = require("ucipass-logger")("mongoclient")
log.transports.console.level = 'info'

let DATABASE_URL = null
try {
    DATABASE_URL  = new URL(process.env.DATABASE_URL);
    DATABASE_URL.username = encodeURIComponent(process.env.DATABASE_USERNAME);
    DATABASE_URL.password = encodeURIComponent(process.env.DATABASE_PASSWORD);        
} catch (error) {
    log.error(`Invalid MongoDB url ${process.env.DATABASE_URL} !`)
    log.error(error.message)
    process.exit(1)
}

module.exports = new Promise((resolve, reject) => {
    MongoClient.connect(DATABASE_URL.href, { useUnifiedTopology: true }, function(err, client) {
        if (err){
            log.error(`Connection to MongoDB at ${process.env.DATABASE_URL} with username ${process.env.DATABASE_USERNAME} failed!`)
            process.exit(1)
        }
        else{
            log.info(`Connection to MongoDB at ${process.env.DATABASE_URL} with username ${process.env.DATABASE_USERNAME}!`)
            return( resolve(client) )
        }
    })
    
});