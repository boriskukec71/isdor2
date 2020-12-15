var log4js = require("log4js");

log4js.configure({
    appenders: {
      everything: { type: 'dateFile', filename: './logs/isidor2.log', maxLogSize: 10485760, pattern: '.yyyy-MM-dd', compress: true, keepFileExt: true },
      delete: { type: 'dateFile', filename: './logs/isidor2Delete.log', maxLogSize: 10485760, pattern: '.yyyy-MM-dd', compress: true, keepFileExt: true }
    },
    categories: {
      default: { appenders: [ 'everything' ], level: 'debug'},
      delete: { appenders: [ 'delete' ], level: 'debug'}
    }
  });

module.exports = log4js;