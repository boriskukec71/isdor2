const connection = require('../connection/connection')
const EndUsers = require('../models/endUserModel');
const pageService = require('./pageService');
const Files = require('../models/fileModel');
const ObjectId = require('mongoose').Types.ObjectId;


function create(endUser, callback) {
    EndUsers.create(endUser, function (err, docs) {
        callback(err, docs);
    })
}

function update(id, endUser, callback) {
    EndUsers.findByIdAndUpdate(id, endUser, { new: true }, function (err, docs) {
        callback(err, docs);
    })
}

async function getAll(query) {
    let pageInfo = pageService.pageInfo(query)
    pageService.searchAny(query);
    pageInfo.data = await EndUsers.find(query).skip(pageService.skip(pageInfo)).limit(pageInfo.size);
    pageInfo.totalElements = await EndUsers.countDocuments(query);
    return pageInfo;
}

function getOne(id, callback) {
    if (ObjectId.isValid(id)) {
        EndUsers.findById(id, function (err, doc) {
            callback(err, doc);
        });
    } else {
        EndUsers.findOne({ "idNumber": id }, function (err, doc) {
            callback(err, doc);
        });
    }
}

async function createEndUserFolder(endUserId) {
    var parent = await Files.findOne({ "name": "Korisnici" });

    var endUser;
    if (ObjectId.isValid(endUserId)) {
        endUser = await EndUsers.findById(ObjectId(endUserId));
    } else {
        endUser = await EndUsers.findOne({ "idNumber": endUserId });
    }
    if (typeof endUser !== 'undefined' && endUser !== null) {
        var folder = await Files.create({ "type": 0, "name": endUser.idNumber, "parentFolder": parent._id });
        await EndUsers.findByIdAndUpdate(endUser._id, { folder: folder._id });
        return folder;
    }
    console.log('Undefined end user:' + endUserId);
    return {};
}

exports.create = create;
exports.getAll = getAll;
exports.getOne = getOne;
exports.update = update;
exports.createEndUserFolder = createEndUserFolder;