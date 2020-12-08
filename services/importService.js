require('../connection/connection')
const Imports = require('../models/importModel');
var fs = require('fs');
const logger = require('../log4js-config').getLogger('importService');
const config = require('../isidorConfig')
const importConfig = require('../import/importFormDiskConfig')
const path = require('path');
const pageService = require('./pageService');
const { execSync } = require('child_process');
const { exec } = require('child_process');

/// TODO put this into separate service
function execShellCommand(cmd) {
    return new Promise((resolve, reject) => {
     exec(cmd, (error, stdout, stderr) => {
      if (error) {
       logger.error(error);
      }
      resolve(stdout ? stdout : stderr);
     });
    });
   }


function getAllImportLocations(callback) {
    fs.readdir(importConfig.import.importFolder, async function(err, files) {
        if (err) {
            logger.error(err);
            callback(err);
        }
        var subFolders = [];
        for (var file of files) {
            if (file.toLowerCase().endsWith('csv')) {
                subFolders.push(file);
            }
            var stat = fs.statSync(importConfig.import.importFolder + '/' + file);
            if (stat.isDirectory()) {
                var importLocation = await Imports.findOne({ "importLocation": file });
                if (!importLocation || importLocation === null || importLocation.status === 'error') {
                    subFolders.push(file);
                }
            }
        }
        callback(undefined, subFolders);
    });
}

async function getAll(query) {
    let pageInfo = pageService.pageInfo(query);
    let sort = pageService.sortBy(query);
    pageService.searchAny(query, ['importLocation', 'createdBy']);
    pageService.searchInterval(query, 'createdAt');
    pageInfo.data = await Imports.find(query).sort(sort).skip(pageService.skip(pageInfo)).limit(pageInfo.size);
    pageInfo.totalElements = await Imports.countDocuments(query);

    return pageInfo;
}

async function start(importLocation, token, user) {
    if (importLocation.toLowerCase().endsWith('.csv')) {
        let importDoc = await Imports.create({importLocation: importLocation, createdBy: user, createdAt: new Date(), type:"file", status:"inProgress"});
        execShellCommand("node ./import/importUsersFromFile.js --token=" + token + " --file=" + importLocation)
        .then(
            async function(response) {
                if (response.endsWith('DONE')) {
                    await Imports.findByIdAndUpdate(importDoc._id, {status:"done"});
                } else {
                    await Imports.findByIdAndUpdate(importDoc._id, {status:"error"});
                }
            }
        );
    } else {
        let importDoc = await Imports.create({importLocation: importLocation, createdBy: user, createdAt: new Date(), type:"folder", status:"inProgress"});
        execShellCommand("node ./import/importFilesFromDisk.js --token=" + token + " --importFrom=" + importLocation)
        .then(
            async function(response) {
                if (response.endsWith('DONE')) {
                    await Imports.findByIdAndUpdate(importDoc._id, {status:"done"});
                } else {
                    await Imports.findByIdAndUpdate(importDoc._id, {status:"error"});
                }
            }
        );
    }
}



exports.getAllImportLocations = getAllImportLocations;
exports.getAll = getAll;
exports.start = start;