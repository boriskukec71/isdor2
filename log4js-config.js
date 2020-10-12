var log4js = require("log4js");

log4js.configure({
    appenders: {
      everything: { type: 'file', filename: './logs/isidor2.log', maxLogSize: 10485760, backups: 3, compress: true }
    },
    categories: {
      default: { appenders: [ 'everything' ], level: 'debug'}
    }
  });


log4js.getLogger().level = "debug";

module.exports = log4js;