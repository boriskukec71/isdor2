const Files = require('../models/fileModel');
const ObjectId = require('mongoose').Types.ObjectId;
const fs = require('fs');
const pageService = require('./pageService');
const logger = require('../log4js-config').getLogger('fileService');
const loggerDelete = require('../log4js-config').getLogger('delete');
const config = require('../isidorConfig')
const { execSync } = require('child_process');
const { exec } = require('child_process');
const correlator = require('express-correlation-id');

/// TODO put this into separate service
function execShellCommand(cmd) {
    return new Promise((resolve, reject) => {
     exec(cmd, (error, stdout, stderr) => {
      if (error) {
       logger.error(error);
      }
      resolve(stdout? stdout : stderr);
     });
    });
   }

async function createFolder(folder) {
    folder.fileType = "folder";
    if (folder.ordinalNumber === null || typeof folder.ordinalNumber === "undefined") {
        folder.ordinalNumber = 1;
    }
    const file = await Files.create(folder);
    return file;
}

async function getAllFolders(query) {
    if (typeof query.parentFolder === "undefined") {
        query["parentFolder"] = { $exists: false };
    }
    query.type = 0;
    let files = await Files.find(query);
    return files;
}

async function getAllFilesByFolder(id, query) {
    if (!query) {
        query = {}
    }
    if (ObjectId.isValid(id)) {
        query.parentFolder = id;
    } else {
        let parentFolder = await Files.findOne({ name: id });
        query.parentFolder = parentFolder._id;
    }
    let pageInfo = pageService.pageInfo(query)
    let sort = pageService.sortBy(query);
    pageService.searchAny(query);
    pageInfo.data = await Files.find(query).sort(sort).skip(pageService.skip(pageInfo)).limit(pageInfo.size);
    pageInfo.totalElements = await Files.countDocuments(query);
    pageInfo.data.forEach(element => {
        delete element.presentation;
        delete element.content;
    });
    return pageInfo;
}

async function getAll(query) {
    let pageInfo = pageService.pageInfo(query)
    pageService.searchAny(query);
    pageInfo.data = await Files.find(query).skip(pageService.skip(pageInfo)).limit(pageInfo.size);
    pageInfo.totalElements = await Files.countDocuments(query);
    pageInfo.data.forEach(element => {
        delete element.presentation;
        delete element.content;
    });
    return pageInfo;
}

async function getBinary(id, what, res) {
    var file = await Files.findById(id);
    if (what === 'presentation' && file.hasPresentationImage) {
        res.contentType(file.presentation.contentType);
        res.send(file.presentation.data)
    } else {
        /// TODO check for what === 'content' otherwise error
        res.contentType(file.content.contentType);
        res.send(file.content.data)
    }
}


async function getOne(id, callback) {
    return await Files.findById(id);
}

async function getOneByName(name, callback) {
    return await Files.findOne({ name: name });
}

async function updateFileData(id, data, callback) {
    return await Files.findByIdAndUpdate(id, data, { new: true });
}

async function saveFile(parentFolder, inputFile, data) {

    if (inputFile.mimetype === 'application/pdf') {
        const pdfFolder = inputFile.path.split('.').slice(0, -1).join('.');
        const pngFilename = '001_' + inputFile.filename.split('.').slice(0, -1).join('.') + '.png';
        var presentationFilePath = pdfFolder + '/' + pngFilename;
        fs.mkdirSync(pdfFolder);
        await execShellCommand(config.pngerExecutable + ' -i "' + inputFile.path + '" -o "' + pdfFolder + '" -p 1');
        await saveFileInternal(parentFolder, inputFile, data, presentationFilePath);
        return;
    }
    await saveFileInternal(parentFolder, inputFile, data)
}
    
async function saveFileInternal(parentFolder, inputFile, data, presentationFilePath) {
    var file = new Files;
    file.name = inputFile.originalname;

    file.fileType = "file";
    file.isBinaryContent = true;
    file.ordinalNumber = data.ordinalNumber;
    if (data.filename && data.filename !== null && typeof data.filename !== "undefined") {
        file.name = data.filename;
    }
    if (ObjectId.isValid(parentFolder)) {
        file.parentFolder = ObjectId(parentFolder);
    } else {
        var folder = await Files.findOne({ "name": parentFolder, "fileType": "folder" });
        if (typeof folder === "undefined" || folder === null) {
            return;
        }
        file.parentFolder = folder._id;
    }
    if (typeof file.parentFolder === "undefined" || file.parentFolder === null) {
        return;
    }
    const filePath = "uploads/" + inputFile.filename;
    if (data.content === "presentation") {
        file.presentation = {};
        file.presentation.data = fs.readFileSync(filePath);
        file.presentation.contentType = inputFile.mimetype;
    } else {
        file.content = {};
        file.content.data = fs.readFileSync(filePath);
        file.content.contentType = inputFile.mimetype;
        if (presentationFilePath) {
            file.presentation = {};
            file.presentation.data = fs.readFileSync(presentationFilePath);
            file.presentation.contentType = 'image/png';
        }
    }
    await file.save();

    fs.unlinkSync(filePath);
}

async function saveFiles(parentFolder, inputFiles, allData) {
    var filenames = allData.filename.split(';');
    let ordinalNumbers = allData.ordinalNumber.split(';');
    let content = allData.content;
    for (var i = 0; i < inputFiles.length; i++) {
        var data = {
            content: content,
            filename: filenames[i],
            ordinalNumber: ordinalNumbers[i]
        }
        await saveFile(parentFolder, inputFiles[i], data);
    }
}

async function deleteFile(id, callback, ids, index) {
    logger.debug("Delete file with id: ", id);
    let doc = await Files.findByIdAndDelete(id);
    let folder = await Files.findById(doc.parentFolder);
    loggerDelete.info(correlator.getId() + " File with id '" + id  + "', name '" + doc.name + "' in folder '" + folder.name + "' deleted!");
    if (ids && index < ids.length - 1) {
        index++;
        await deleteFile(ids[index], callback, ids, index);
    } 
}

async function deleteFiles(ids, folderId, callback) {
    if (folderId) {
        await Files.deleteMany({ parentFolder: folderId });
        return;
    }
    await deleteFile(ids[0], callback, ids, 0);
}

module.exports = {
    createFolder : createFolder,
    getAllFolders : getAllFolders,
    getAll : getAll,
    getOne : getOne,
    getOneByName : getOneByName,
    saveFile : saveFile,
    getBinary : getBinary,
    getAllFilesByFolder : getAllFilesByFolder,
    updateFileData : updateFileData,
    saveFiles : saveFiles,
    deleteFile : deleteFile,
    deleteFiles : deleteFiles
}