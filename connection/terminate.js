const { command } = require('yargs');

var log4js = require('../log4js-config');
var logger = log4js.getLogger('terminate');

function terminate(server, options = { coredump: false, timeout: 1000 }) {
    // Exit function    
    const exit = code => {
      log4js.shutdown();
      options.coredump ? process.abort() : process.exit(code)
    }
  
    return (code, reason) => (err, promise) => {
      if (err && err instanceof Error) {
        logger.error(err.message, err.stack);
      } else {
        logger.info("Terminating isdor2 server (code, reason)!", code, reason); 
      }
      server.close(function() {logger.debug("Server closed")});
      setTimeout(function() {exit(code)}, options.timeout).unref()
    }
  }
  
  module.exports = terminate