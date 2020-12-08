const fs = require("fs");
const axios = require("axios");
const config = require("./importFormDiskConfig");
const readline = require('readline');
const iconv = require('iconv-lite');
var os = require('os');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

var log4js = require("log4js");

log4js.configure({
    appenders: {
        everything: { type: 'file', filename: './logs/isidor2ImportUsers.log', maxLogSize: 10485760, backups: 3, compress: true }
    },
    categories: {
        default: { appenders: ['everything'], level: 'debug' }
    }
});

var delimiter ='\\';
var outputMessage = 'DONE';

log4js.getLogger().level = "debug";
const logger = log4js.getLogger();

const url = config.protocol + "://" + config.host + ":" + config.port;
var token;
var defaultRequestConfig = {
    headers: {}
};

const importFile = async (file, cp) => {

    var fileStream = fs.createReadStream(config.import.importFolder + delimiter + file);
       
    if (cp) {
        fileStream = fileStream.pipe(iconv.decodeStream(cp));
    }

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.
    var lineIndex = 1;
    var userType = 'user'; 
    for await (const line of rl) {
        logger.info(`Importing line: ${line}`);
        var words = line.split(";");
        var index = -1;
        if (lineIndex === 1 && words.length < 4) {
            userType = 'building'
        }
        var endUser = { userType: userType, homeNo: "" };
        for await (const word of words) {
            index++;
            var wordTrimed = word.trim();
            if (userType === 'building') {
                if (index === 0) {
                    endUser.idNumber = parseInt(wordTrimed);
                    continue; 
                }
                if (index === 1) {
                    endUser.name = wordTrimed; 
                    continue
                }
                continue;
            }
            if (index === 1) {
                endUser.idNumber = parseInt(wordTrimed);
                continue;
            }
            if (index === 2) {
                // ignored
                continue;
            }
            if (index === 3) {
                endUser.name = wordTrimed;
                continue;
            } if (index === 4) {
                if (wordTrimed && wordTrimed !== null && wordTrimed !== "") {
                    endUser.name = endUser.name + " " + wordTrimed;
                    continue;
                }
            }
            if (index === 5) {
                endUser.municipality = wordTrimed;
                continue;
            }
            if (index === 6) {
                endUser.city = wordTrimed;
                continue;
            }
            if (index === 7) {
                endUser.street = wordTrimed;
                continue;
            }
        }
        // TODO file za zgrade, vidi ndexe u petlji 
        var endUserId;
        const responseFolder = await axios.get(url + '/folders/' + endUser.idNumber, defaultRequestConfig);
        if (responseFolder.data === null) {
            logger.info(`Folder ${endUser.idNumber} does not exist! Creting new one.`);
            const newFolderResponse = await axios.post(url + "/folders", { name: endUser.idNumber, fileType: "folder" }, defaultRequestConfig);
            endUser.folder = newFolderResponse.data._id;
        } else {
            endUser.folder = responseFolder.data._id;
        }

        const response = await axios.get(url + "/end-users/" + endUser.idNumber, defaultRequestConfig);
        if (response.data === null) {
            const responseNewEndUser = await axios.post(url + "/end-users", endUser, defaultRequestConfig);
            endUserId = responseNewEndUser.data._id;
        } else {
            logger.info(`End user ${endUser.idNumber} already exist! Updating!`);
            endUserId = response.data._id;
            var endUserUpdateData = response.data;
            endUserUpdateData.name = endUser.name;
            endUserUpdateData.street = endUser.street;
            endUserUpdateData.municipality = endUser.municipality;
            endUserUpdateData.city = endUser.city;
            endUserUpdateData.userType = endUser.userType;
            endUserUpdateData.folder = endUser.folder;
            const responseNewEndUser = await axios.put(url + "/end-users/" + endUserId, endUser, defaultRequestConfig);
        }
        lineIndex++;
    }
}

(async () => {
    try {
        const argv = yargs(hideBin(process.argv)).argv
        if (os.platform() === 'linux') {
            delimiter = '/';
        }
        var file =  argv.file;
        if (argv.username && argv.password) {
            const response = await axios.post(url + '/login', {username: argv.username, password:argv.password}); 
            token = response.data.token;
        } 
        if (argv.token) {
            token = argv.token;
        }
        logger.info("TOKEN: ", token);
        defaultRequestConfig.headers.authorization = token;
        var cp = 'win1250';
        if (argv.cp) {  // win1250 for txt from progress
            cp = argv.cp;
        } else if (config.cp) {
            cp = config.cp;
        }

        logger.info(`Importing file: ${file}`);

        await importFile(file, cp);

        logger.info(`Finished importing file: ${file}`);
    } catch (error) {
        logger.error(error);
        outputMessage = 'ERROR'
    }
    console.log(outputMessage);
})();

