const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const axios = require("axios");
const config = require("./importFormDiskConfig");
var FormData = require('form-data');

var log4js = require("log4js");

log4js.configure({
    appenders: {
        everything: { type: 'file', filename: 'isidor2ImprtFiles.log', maxLogSize: 10485760, backups: 3, compress: true }
    },
    categories: {
        default: { appenders: ['everything'], level: 'debug' }
    }
});
log4js.getLogger().level = "debug";
const logger = log4js.getLogger();

const url = config.protocol + "://" + config.host + ":" + config.port

const importFolder = async (root1, folders) => {
    var serverUrl = config.protocol + "//" + config.host + ":" + config.port;
    var pngCounter = 0;
    for (i = 0; i < folders.length; i++) {
        var folder = folders[i];
        var fullFolderPath = root1 + "/" + folder;
        var files = fs.readdirSync(fullFolderPath);

        var folderId;
        var endUser;
        const response = await axios.get(url + "/folders/" + folder);
        logger.info("Checking: " + folder);
        if (response.data === null) {
            logger.info("No folder with name " + folder + " creting new one");
            const newFolderResponse = await axios.post(url + "/folders", { name: folder, fileType: "folder" });
            logger.info("folder " + folder + " created");
            folderId = newFolderResponse.data._id;
        } else {
            folderId = response.data._id;
        }

        const endUserResponse = await axios.get(url + "/end-users/" + folder);
        if (endUserResponse.data === null) {
            logger.info("No end user with name " + folder + " creting new one");
            const newEndUserResponse = await axios.post(url + "/end-users", { idNumber: folder, userType: "unknown" }); // TODO user Type iz početnog broja šifre
            logger.info("end user " + folder + " created");
            endUser = newEndUserResponse.data;
        } else {
            endUser = endUserResponse.data;
        }

        endUser.folder = folderId;
        await axios.put(url + "/end-users/" + endUser._id, endUser);

        for (j = 0; j < files.length; j++) {
            var file = files[j];
            var stat = fs.statSync(fullFolderPath + "/" + file);
            if (!stat.isDirectory() && file.endsWith(".png")) {
                var fullPath = path.resolve(fullFolderPath + "/" + file);
                pngCounter++;
                logger.info(folder + ": " + fullPath + " " + pngCounter);
                let formData = new FormData();
                formData.append("content", "content");
                var realFilename = file;
                var ordinalNumber = 1;
                var filenameParts = file.split("_");
                if (filenameParts.length > 1) {
                    ordinalNumber = parseInt(filenameParts[0]);
                    realFilename = filenameParts[1];
                }
                formData.append("ordinalNumber", ordinalNumber);
                formData.append("filename", realFilename);
                formData.append("image", fs.createReadStream(fullPath));
                // const newFileResponse = await axios.post(url + "/folders/" + folder, formData, {headers: {"Content-Type": "multipart/form-data"} });
                var headers = formData.getHeaders();
                ///headers["Content-Length"] = formData.getLengthSync();
                const request_config = {
                    headers: {
                        ...formData.getHeaders()
                    }
                };
                const newFileResponse = await axios.post(url + "/folders/" + folder, formData, request_config);
            }
        }

    }
}


(async () => {

    var root = process.argv[2];
    var files = fs.readdirSync(root);
    var folders = files.filter(file => {
        var stat = fs.statSync(root + "/" + file);
        return stat.isDirectory();
    })

    logger.info(`Importing files from: ${root}`);

    await importFolder(root, folders);

    logger.info(`Finished importing files from: ${root}`);
})();



// var postImage = 'curl -F "content=presentation" -F "image=@' + fullPath + '" \'http://localhost:4000/folders/' + name + '\' -H "Content-Type: multipart/form-data" && sleep 1';
