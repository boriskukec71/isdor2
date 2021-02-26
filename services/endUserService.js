const EndUsers = require('../models/endUserModel');
const pageService = require('./pageService');
const Files = require('../models/fileModel');
const ObjectId = require('mongoose').Types.ObjectId;


async function create(endUser) {
    return await EndUsers.create(endUser);
}

async function update(id, endUser) {
    return await EndUsers.findByIdAndUpdate(id, endUser, { new: true });
}

async function getAll(query) {
    let pageInfo = pageService.pageInfo(query)
    pageService.searchAny(query, ['name', 'idNumber', 'street', 'city']);
    pageInfo.data = await EndUsers.find(query).skip(pageService.skip(pageInfo)).limit(pageInfo.size);
    pageInfo.totalElements = await EndUsers.countDocuments(query);
    return pageInfo;
}

async function getOne(id) {
    if (ObjectId.isValid(id)) {
        let endUser = await EndUsers.findById(id);
        return endUser;
    } else {
        let endUser = await EndUsers.findOne({ "idNumber": id });
        return endUser;
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

module.exports = {
    create : create,
    getAll : getAll,
    getOne : getOne,
    update : update,
    createEndUserFolder : createEndUserFolder
}