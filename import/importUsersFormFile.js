const fs = require("fs");
const axios = require("axios");
const config = require("./importFormDiskConfig");
const readline = require('readline');
const iconv = require('iconv-lite');

var log4js = require("log4js");

log4js.configure({
    appenders: {
        everything: { type: 'file', filename: 'isidor2ImprtUsers.log', maxLogSize: 10485760, backups: 3, compress: true }
    },
    categories: {
        default: { appenders: ['everything'], level: 'debug' }
    }
});


log4js.getLogger().level = "debug";
const logger = log4js.getLogger();

// 1. get all subfolders form . folder
// 2. take subfolder name as idNumber
// 3. post /end-users/:idNmber/folder
// 4. take all files from subflder
// 5. post file to /folders/:idNumber


const url = config.protocol + "://" + config.host + ":" + config.port

const importFile = async (file, userType, cp) => {

    var fileStream = fs.createReadStream(file);
       
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
    for await (const line of rl) {
        logger.info(`Importing line: ${line}`);
        var words = line.split(";");
        var index = -1;
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

        const responseFolder = await axios.get(url + "/folders/" + endUser.idNumber);
        if (responseFolder.data === null) {
            logger.info(`Folder ${endUser.idNumber} does not exist! Creting new one.`);
            const newFolderResponse = await axios.post(url + "/folders", { name: endUser.idNumber, fileType: "folder" });
            endUser.folder = newFolderResponse.data._id;
        } else {
            endUser.folder = responseFolder.data._id;
        }

        const response = await axios.get(url + "/end-users/" + endUser.idNumber);
        if (response.data === null) {
            const responseNewEndUser = await axios.post(url + "/end-users", endUser);
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
            const responseNewEndUser = await axios.put(url + "/end-users/" + endUserId, endUser);
        }
        lineIndex++;
    }
}



(async () => {
    var file = process.argv[2];
    var userType = process.argv[3];
    var cp;
    if (process.argv.length === 5) {  // win1250 for txt from progress
        cp = process.argv[4];
    }

    logger.info(`Importing file: ${file}`);

    await importFile(file, userType, cp);

    logger.info(`Finished importing file: ${file}`);
})();

