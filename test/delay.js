// var log = require("ucipass-logger")("server")
// log.transports.console.level = 'info'
// log.transports.file.level = 'error'

module.exports = function (msDelay){
    // log.debug("timeout starts:")
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // log.debug("timeout ends:")
            resolve(true)
        }, msDelay);
    });
}