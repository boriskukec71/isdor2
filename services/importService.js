const Imports = require('../models/importModel');
const { promises: fs } = require("fs");
const logger = require('../log4js-config').getLogger('importService');
const importConfig = require('../import/importFormDiskConfig')
const pageService = require('./pageService');
const { exec } = require('child_process');
const correlator = require('express-correlation-id');

const { Worker } = require('worker_threads');
const importEndUserWorker = require.resolve('../import/importUsersFromFile');

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

const startImportWorker = (importWorker) => {
    const worker = new Worker(importWorker);
    worker.on('message', (output) => console.debug(output));
    worker.on('error', (error) => logger.error(error));
    worker.on('exit', (code) => {
        if (code !== 0)
            throw new Error(`Worker stopped with exit code ${code}`);
    });
    return worker;
}


async function getAllImportLocations(callback) {
    let files = await fs.readdir(importConfig.import.importFolder);
    let subFolders = [];
    for (const file of files) {
        if (file.toLowerCase().endsWith('csv') || file.toLowerCase().endsWith('txt')) {
            subFolders.push(file);
        }
        const stat = await fs.stat(importConfig.import.importFolder + '/' + file);
        if (stat.isDirectory()) {
            let importLocation = await Imports.findOne({ "importLocation": file });
            if (!importLocation || importLocation === null || importLocation.status === 'error') {
                subFolders.push(file);
            }
        }
    }
    return subFolders;
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
    if (importLocation.toLowerCase().endsWith('.csv') || importLocation.toLowerCase().endsWith('.txt')) {
        let importDoc = await Imports.create({ importLocation: importLocation, createdBy: user, createdAt: new Date(), type: "file", status: "inProgress" });
        const worker = startImportWorker(importEndUserWorker);
        worker.postMessage({token : token, file : importLocation, correlationId : correlator.getId()});
        /* execShellCommand("node ./import/importUsersFromFile.js --token=" + token + " --file=" + importLocation + " --correlationId=" + correlator.getId())
            .then(
                async function (response) {
                    logger.debug("Import of end users ends with: ", response);
                    if (response.indexOf('DONE') >= 0) {
                        await Imports.findByIdAndUpdate(importDoc._id, { status: "done" });
                    } else {
                        await Imports.findByIdAndUpdate(importDoc._id, { status: "error" });
                    }
                }
            ); */
    } else {
        let importDoc = await Imports.create({ importLocation: importLocation, createdBy: user, createdAt: new Date(), type: "folder", status: "inProgress" });
        execShellCommand("node ./import/importFilesFromDisk.js --token=" + token + " --importFrom=" + importLocation + " --correlationId=" + correlator.getId())
            .then(
                async function (response) {
                    logger.debug("Import of files ends with: ", response);
                    if (response.indexOf('DONE') >= 0) {
                        await Imports.findByIdAndUpdate(importDoc._id, { status: "done" });
                    } else {
                        await Imports.findByIdAndUpdate(importDoc._id, { status: "error" });
                    }
                }
            );
    }
}

module.exports = {
    getAllImportLocations: getAllImportLocations,
    getAll: getAll,
    start: start
}