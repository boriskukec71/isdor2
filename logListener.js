require('./connection/connection');
var AppUserAccessLogs = require('./models/appUserAccessLogModel');
const Tail = require('tail').Tail;
const config = require('./isidorConfig');


const dataStartString = 'index -';
const dataFieldSeparattor = '|'
const system = 'system';
 
tail = new Tail('./logs/isidor2.log', {useWatchFile: true, flushAtEOF: true});
 
tail.on('line', function(data) {
  processLogLine(data);
});
 
tail.on('error', function(error) {
  console.log('ERROR: ', error);
});

function processLogLine(line) {
    var dataIndex = line.indexOf(dataStartString) + dataStartString.length + 1;

    if (dataIndex <= dataStartString.length) {
        return;
    }
    var data = line.substring(dataIndex);
    var dataFields = data.split(dataFieldSeparattor);
    var currentTime = new Date();
    var logTime = getTime(line);
    var urlMainParts = dataFields[5].split('?');

    var urlTranslated = getUrlTranslated(urlMainParts[0]);
    var requestParams = getRequestParams(urlMainParts[1])

    var responseStatus = dataFields[7];

    AppUserAccessLogs.create({
        "urlSlug": urlTranslated,
        "username": dataFields[1],
        "role": dataFields[2],
        "time": logTime,
        "method": dataFields[4],
        "url": dataFields[5],
        "correlationId": dataFields[0],
        "requestParams": requestParams,
        "requestBody": JSON.parse(dataFields[6]),
        "responseBody": {},
        "responseStatus": responseStatus,
        "createdAt": currentTime,
        "createdBy": system,
        "modifiedAt": currentTime,
        "modifiedBy": system 
    }, function (err, appUserAccessLog) {

    })
}

function getTime(timeString) {
    var rightIndex = timeString.indexOf(']');
    var time = new Date(timeString.substring(1, rightIndex));
    return time;
}

function getUrlTranslated(url) {
    var urlTranslated = url;
    for (const key of Object.keys(config.accessLogger.translations.pathSegments)) {
        urlTranslated = urlTranslated.replace(key, config.accessLogger.translations.pathSegments[key])
    }
    return urlTranslated;
}

function getRequestParams(queryParams) {
    if (!queryParams || queryParams.length === 0) {
        return;
    } 

    var paramPairs = queryParams.split('&');

    var requestParams = {};
    for(var index in paramPairs) {
        var param = paramPairs[index].split('=');

        requestParams[param[0]] = param [1];
    }

    return requestParams;
}

console.log(`isidor2 log listener started`);