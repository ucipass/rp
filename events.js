let Events = require('events');
let events = new Events.EventEmitter();
// events.setMaxListeners(111);
// process.setMaxListeners(110);
module.exports = events

//Assign the event handler to an event:
// eventEmitter.on('scream', myEventHandler);

//Fire the 'scream' event:
// eventEmitter.emit('scream');