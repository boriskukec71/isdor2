const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');
const config = require('./importFormDiskConfig');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
var FormData = require('form-data');
var os = require('os');

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

var delimiter = '\\';
var outputMessage = 'DONE';

function filenameToPng(filename) {
    var filenameParts = filename.split(".");
    if (filenameParts.length == 0) {
        return;
    }
    filenameParts[filenameParts.length - 1] = "png";
    var pngFilename = filenameParts[0];
    for (var i = 1; i < filenameParts.length; i++) {
        var part = filenameParts[i];
        pngFilename = pngFilename + "." + part;
    }
    return pngFilename;
}

const importFolder = async (folder, subFolders, skipUnexistingFolders) => {

    var debugOnly = config.import.debugOnly;
    var errorSubFolder;
    var skippedSubFolder;
    var doneSubFolder;
    errorSubFolder =  config.import.importOutputFolder + delimiter + folder + delimiter + config.import.subFolders.importError;
    skippedSubFolder =  config.import.importOutputFolder + delimiter + folder + delimiter + config.import.subFolders.importSkipped;
    doneSubFolder =  config.import.importOutputFolder + delimiter + folder + delimiter + config.import.subFolders.importDone;
    var pngCounter = 0;
    for (i = 0; i < subFolders.length; i++) {
        var subFolder = subFolders[i];
        var fullFolderPath = config.import.importFolder + delimiter + folder + delimiter + subFolder;
        if (config.import.validateFolderNameAsNumber ) {
            const regex = /^[1-9]\d+$/g;
            const found = subFolder.match(regex);               
            if (found === null || found.lenght === 0) {
                logger.error(subFolder + ' is not a number!');
                outputMessage = 'ERROR';
                if (!debugOnly) {
                    fs.moveSync(fullFolderPath, errorSubFolder + delimiter + subFolder) 
                }
                continue;
            }
        }

        var files = fs.readdirSync(fullFolderPath);

        var folderId;
        var endUser;

        const response = await axios.get(url + '/folders/' + subFolder, defaultRequestConfig);

        logger.info('Checking: ' + subFolder);
        if (response.data === null) {
            logger.info('No folder with name ' + subFolder);
            if (skipUnexistingFolders) {
                logger.info('Moving to skipped!');
                if (!debugOnly) {
                    fs.moveSync(fullFolderPath, skippedSubFolder + delimiter + subFolder) 
                }  // TODO
                continue;
            }
            logger.info('Creting new one');
            if (!debugOnly) {
                const newFolderResponse = await axios.post(url + '/folders', { name: subFolder, fileType: 'folder' }, defaultRequestConfig);
                logger.info('folder ' + subFolder + ' created');
                folderId = newFolderResponse.data._id; 
            }
        } else {
            folderId = response.data._id;
        }

        const endUserResponse = await axios.get(url + '/end-users/' + subFolder, defaultRequestConfig);
        if (endUserResponse.data === null) {
            logger.info('No end user with name ' + subFolder + ' creting new one');
            if (!debugOnly) {
                const newEndUserResponse = await axios.post(url + '/end-users', { idNumber: subFolder, userType: 'unknown' }, defaultRequestConfig); // TODO user Type iz početnog broja šifre
                logger.info('end user ' + subFolder + ' created');
                endUser = newEndUserResponse.data;
            } else {
                endUser = {};
            }
        } else {
            endUser = endUserResponse.data;
        }

        endUser.folder = folderId;
        if (!debugOnly) {
            fs.ensureDirSync(doneSubFolder + delimiter + subFolder);
            await axios.put(url + '/end-users/' + endUser._id, endUser, defaultRequestConfig);
        }

        var filesExtended = [];
        for (j = 0; j < files.length; j++) {
            var file = files[j];
            var stat = fs.statSync(fullFolderPath + delimiter + file);
            filesExtended.push({stat: stat, date: stat.mtime, filename: file});
        }

        let sortKey = config.import.sortBy;
        filesExtended.sort((a, b) => (a[sortKey] > b[sortKey]) ? 1 : -1);

        for (j = 0; j < filesExtended.length; j++) {
            var fileExtended = filesExtended[j];
            var fullPath = path.resolve(fullFolderPath + delimiter + fileExtended.filename);
            if (!fileExtended.stat.isDirectory() && fileExtended.filename.toLowerCase().endsWith('.tif')) {
                logger.info('Converting ' + fileExtended.filename + ' to png!');
                execSync(config.import.pngerExecutable + ' -i "' + fullPath + '" -o ' + fullFolderPath);
                fileExtended.originalFilename = fileExtended.filename;
                var pngFilename = filenameToPng(fileExtended.filename);
                fileExtended.filename = pngFilename;
                logger.info('Importing as ' + fileExtended.filename);
                fullPath = path.resolve(fullFolderPath + delimiter + fileExtended.filename);
            }
            if (!fileExtended.stat.isDirectory() && fileExtended.filename.endsWith('.png')) {
                pngCounter++;
                logger.info(subFolder + ': ' + fullPath + ' ' + pngCounter);
                let formData = new FormData();
                formData.append('content', 'content');
                var realFilename = fileExtended.filename;
                var ordinalNumber = j +1;
                if (config.import.ordinalInPrefix) {
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
                    const newFileResponse = await axios.post(url + '/folders/' + subFolder, formData, request_config)
                    .then((response) => {
                        fs.moveSync(fullFolderPath + delimiter + fileExtended.filename, doneSubFolder + delimiter + subFolder + delimiter + fileExtended.filename);
                        if (fileExtended.originalFilename) {
                            fs.moveSync(fullFolderPath + delimiter + fileExtended.originalFilename, doneSubFolder + delimiter + subFolder + delimiter + fileExtended.originalFilename);
                        }
                    })
                } else {
                    logger.debug('Imported: ' + fullPath + ' as ' + ordinalNumber + ' file in folder ' + subFolder);
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
    try {
        const argv = yargs(hideBin(process.argv)).argv;
        if (argv.username && argv.password) {
            const response = await axios.post(url + '/login', {username: argv.username, password:argv.password}); 
            token = response.data.token;
        } 
        if (argv.token) {
            token = argv.token;
        }
        defaultRequestConfig.headers.authorization = token;
        if (os.platform() === 'linux') {
            delimiter = '/';
        }
        var folder;
        var root1;
        if (argv.importFrom) {
            root1 = config.import.importFolder + delimiter;/// + argv.importFrom;
            folder = argv.importFrom
        } else {
            root1 = config.import.importFolder + delimiter;/// + config.import.subFolders.readyForImport;
            folder = config.import.subFolders.readyForImport;
        }
        var skipUnexistingFolders = config.import.skipUnexistingFolders
        
        var files = fs.readdirSync(root1 + folder);
        var subFolders = files.filter(file => {
            var stat = fs.statSync(root1 + folder + delimiter + file);
            return stat.isDirectory();
        })

        logger.info(`Importing files from: ${folder}`);

        await importFolder(folder, subFolders, skipUnexistingFolders);

        logger.info(`Finished importing files from: ${folder}`);
    } catch (err) {
        logger.error(err);
        outputMessage = 'ERROR'
    };
    console.log(outputMessage);
})();

