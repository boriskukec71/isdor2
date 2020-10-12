require('./connection/connection');
var AppUserAccessLogs = require('./models/appUserAccessLogModel');
const Tail = require('tail').Tail;


const dataStartString = 'index -';
const dataFieldSeparattor = '|'
const system = 'system';
 
tail = new Tail('./logs/isidor2.log');
 
tail.on('line', function(data) {
  console.log(data);
  processLogLine(data);
});
 
tail.on('error', function(error) {
  console.log('ERROR: ', error);
});

function processLogLine(line) {
    var dataIndex = line.indexOf(dataStartString) + dataStartString.length + 1;
    console.log('>>' + dataIndex);
    if (dataIndex <= dataStartString.length) {
        return;
    }
    var data = line.substring(dataIndex);
    var dataFields = data.split(dataFieldSeparattor);
    var currentTime = new Date();
    var logTime = getTime(line);
    var urlSlug = getUrlSlug(dataFields[5]);
    var responseStatus = dataFields[7];

    AppUserAccessLogs.create({
        'urlSlug': urlSlug,
        'username': dataFields[1],
        'role': dataFields[2],
        'time': logTime,
        'method': dataFields[4],
        'url': dataFields[5],
        'correlationId': dataFields[0],
        'requestParams': {},
        'requestBody': JSON.parse(dataFields[6]),
        'responseBody': {},
        'responseStatus': responseStatus,
        'createdAt': currentTime,
        'createdBy': system,
        'modifiedAt': currentTime,
        'modifiedBy': system 
    }, function (err, appUserAccessLog) {

    })
}

function getTime(timeString) {
    var rightIndex = timeString.indexOf(']');
    var time = new Date(timeString.substring(1, rightIndex));
    return time;
}

function getUrlSlug(url) {
    console.log(url);
    var urlSlug = url.replace('/', '_');
    return urlSlug;
}

console.log(`isidor2 log listener started`);