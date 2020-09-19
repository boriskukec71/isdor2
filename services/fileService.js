const connection = require('../connection/connection')
const Files = require('../models/fileModel');
const ObjectId = require('mongoose').Types.ObjectId;
var fs = require('fs');
const pageService = require('./pageService');


function createFolder(folder, callback) {
    folder.fileType = "folder";
    if (folder.ordinalNumber === null || typeof folder.ordinalNumber ==="undefined") {
        folder.ordinalNumber = 1;
    }
    Files.create(folder, function(err, docs) {
        callback(err, docs);
    })
}

function getAllFolders(query, callback) {

    if (typeof query.parentFolder === "undefined") {
        query["parentFolder"] = {$exists : false};
    }
    query.type = 0;

    Files.find(query, function (err, docs) {
        callback(err, docs);
    });
}

async function getAll(query) {
    let pageInfo = pageService.pageInfo(query)
    console.log(pageInfo);
    pageService.searchAny(query);
    pageInfo.data = await Files.find(query).skip(pageService.skip(pageInfo)).limit(pageInfo.size);
    pageInfo.totalElements = await Files.countDocuments(query);
    pageInfo.data.forEach(element => {
        delete element.presentation;
        delete element.content;
    });
    console.log(pageInfo);
    return pageInfo;
}

async function getBinary(id, what, res) {
    try {
        var file = await Files.findById(id);
        console.log(file);
        if (what === 'presentation' && file.hasPresentationImage) {
            console.log(file.presentation.contentType);
            res.contentType(file.presentation.contentType);
            res.send(file.presentation.data)
        } else {
            /// TODO check for what === 'content' otherwise error
            res.contentType(file.content.contentType);
            res.send(file.content.data)
        }
    } catch (err) {
        console.log(err);
        res.send(500);
    };
}


function getOne(id, callback) {
    Files.findById(id, function (err, doc) {
        callback(err, doc);
    });
}

function getOneByName(name, callback) {
     Files.findOne({name: name}, function (err, doc) {
        callback(err, doc);
    });
}

async function saveFile(parentFolder, inputFile, data) {
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
        var folder = await Files.findOne({"name" : parentFolder, "fileType": "folder"});
        if (typeof folder === "undefined" || folder === null) {
            return;
        }
        file.parentFolder = folder._id;
    }
    if (typeof file.parentFolder === "undefined" || file.parentFolder === null) {
        return;
    }
    const filePath = "uploads/" + inputFile.filename;
    if (data.content === "presentation" ) {
        file.presentation = {};
        file.presentation.data = fs.readFileSync(filePath);
        file.presentation.contentType = inputFile.mimetype;
    } else {
        file.content = {};
        file.content.data = fs.readFileSync(filePath);
        file.content.contentType = inputFile.mimetype;
    }
    await file.save();
    // TODO clear uploads folder
    fs.unlinkSync(filePath);
}

exports.createFolder = createFolder;
exports.getAllFolders = getAllFolders;
exports.getAll = getAll;
exports.getOne = getOne;
exports.getOneByName = getOneByName;
exports.saveFile = saveFile;
exports.getBinary = getBinary;