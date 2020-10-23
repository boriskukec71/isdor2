const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');
const config = require('./importFormDiskConfig');
var FormData = require('form-data');

var log4js = require('log4js');

log4js.configure({
    appenders: {
        everything: { type: 'file', filename: 'isidor2ImprtFiles.log', maxLogSize: 10485760, backups: 3, compress: true }
    },
    categories: {
        default: { appenders: ['everything'], level: 'debug' }
    }
});
log4js.getLogger().level = 'debug';
const logger = log4js.getLogger();

const url = config.protocol + '://' + config.host + ':' + config.port
var token;
var defaultRequestConfig = {
    headers: {
    }
};

const importFolder = async (root1, folders, skipUnexistingFolders) => {

    var debugOnly = config.import.debugOnly;
    var errorSubFolder =  config.import.importFolder + '/' + config.import.subFolders.importError;
    var skippedSubFolder =  config.import.importFolder + '/' + config.import.subFolders.importSkipped;
    var doneSubFolder =  config.import.importFolder + '/' + config.import.subFolders.importDone;
    var pngCounter = 0;
    for (i = 0; i < folders.length; i++) {
        var folder = folders[i];
        var fullFolderPath = root1 + '/' + folder;
        if (config.import.validateFolderNameAsNumber ) {
            const regex = /^[1-9]\d+$/g;
            const found = folder.match(regex);               
            if (found === null || found.lenght === 0) {
                logger.error(folder + ' is not a number!');
                if (!debugOnly) {
                    fs.moveSync(fullFolderPath, errorSubFolder + '/' + folder) 
                }
                continue;
            }
        }

        var files = fs.readdirSync(fullFolderPath);

        var folderId;
        var endUser;

        const response = await axios.get(url + '/folders/' + folder, defaultRequestConfig);

        logger.info('Checking: ' + folder);
        if (response.data === null) {
            logger.info('No folder with name ' + folder);
            if (skipUnexistingFolders) {
                logger.info('Moving to skipped!');
                if (!debugOnly) {
                    fs.moveSync(fullFolderPath, skippedSubFolder + '/' + folder) 
                }  // TODO
                continue;
            }
            logger.info('Creting new one');
            if (!debugOnly) {
                const newFolderResponse = await axios.post(url + '/folders', { name: folder, fileType: 'folder' }, defaultRequestConfig);
                logger.info('folder ' + folder + ' created');
                folderId = newFolderResponse.data._id; 
            }
        } else {
            folderId = response.data._id;
        }

        const endUserResponse = await axios.get(url + '/end-users/' + folder, defaultRequestConfig);
        if (endUserResponse.data === null) {
            logger.info('No end user with name ' + folder + ' creting new one');
            if (!debugOnly) {
                const newEndUserResponse = await axios.post(url + '/end-users', { idNumber: folder, userType: 'unknown' }, defaultRequestConfig); // TODO user Type iz početnog broja šifre
                logger.info('end user ' + folder + ' created');
                endUser = newEndUserResponse.data;
            } else {
                endUser = {};
            }
        } else {
            endUser = endUserResponse.data;
        }

        endUser.folder = folderId;
        if (!debugOnly) {
            fs.ensureDirSync(doneSubFolder + '/' + folder);
            await axios.put(url + '/end-users/' + endUser._id, endUser, defaultRequestConfig);
        }

        var filesExtended = [];
        for (j = 0; j < files.length; j++) {
            var file = files[j];
            var stat = fs.statSync(fullFolderPath + '/' + file);
            filesExtended.push({stat: stat, date: stat.ctime, filename: file});
        }

        let sortKey = config.import.sortBy;
        filesExtended.sort((a, b) => (a[sortKey] > b[sortKey]) ? 1 : -1);

        for (j = 0; j < filesExtended.length; j++) {
            var fileExtended = filesExtended[j];
            if (!fileExtended.stat.isDirectory() && fileExtended.filename.endsWith('.png')) {
                var fullPath = path.resolve(fullFolderPath + '/' + fileExtended.filename);
                pngCounter++;
                logger.info(folder + ': ' + fullPath + ' ' + pngCounter);
                let formData = new FormData();
                formData.append('content', 'content');
                var realFilename = fileExtended.filename;
                var ordinalNumber = j +1;
                if (config.import.oridnalInPrefix) {
                    var filenameParts = file.split('_');
                    if (filenameParts.length > 1) {
                        ordinalNumber = parseInt(filenameParts[0]);
                        realFilename = filenameParts[1];
                    }
                } 
                formData.append('ordinalNumber', ordinalNumber);
                formData.append('filename', realFilename);
                formData.append('image', fs.createReadStream(fullPath));
                var headers = formData.getHeaders();
                const request_config = {
                    headers: {
                        ...formData.getHeaders(),
                        authorization: token,
                    }
                };
                if (!debugOnly) {
                    const newFileResponse = await axios.post(url + '/folders/' + folder, formData, request_config)
                    .then((response) => {
                        console.log(fileExtended.filename);
                        fs.moveSync(fullFolderPath + '/' + fileExtended.filename, doneSubFolder + '/' + folder + '/' + fileExtended.filename);
                    })
                } else {
                    logger.debug('Imported: ' + fullPath + ' as ' + ordinalNumber + ' file in folder ' + folder);
                }
            }
        }
        var filesAfter = fs.readdirSync(fullFolderPath);
        if (filesAfter.length === 0) {
            fs.rmdirSync(fullFolderPath);
        }

    }
}


(async () => {

    const response = await axios.post(url + '/login', {username: process.argv[2], password:process.argv[3]}); 
    token = response.data.token;
    console.log('Authorization: ' + token);
    defaultRequestConfig.headers.authorization = token;
    var root = config.import.importFolder + '/' + config.import.subFolders.readyForImport;
    var skipUnexistingFolders = config.import.skipUnexistingFolders
    if (process.argv[4]) {
        root = process.argv[4]; 
        skipUnexistingFolders = false;
    } 
    
    var files = fs.readdirSync(root);
    var folders = files.filter(file => {
        var stat = fs.statSync(root + '/' + file);
        return stat.isDirectory();
    })

    logger.info(`Importing files from: ${root}`);

    await importFolder(root, folders, skipUnexistingFolders);

    logger.info(`Finished importing files from: ${root}`);
})();

