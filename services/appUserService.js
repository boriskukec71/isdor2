///require('../connection/connection')
const AppUsers = require('../models/appUserModel');
const pageService = require('./pageService');
const ObjectId = require('mongoose').Types.ObjectId;
const bcrypt = require('bcrypt')


async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    return hash;
}

async function create(appUser, callback) {
    if (appUser.password) {
        appUser.password = await hashPassword(appUser.password);
    }
    AppUsers.create(appUser, function (err, doc) {
        delete doc.password;
        callback(err, doc);
    })
}

async function update(id, appUser, callback) {
    if (appUser.password) {
        appUser.password = await hashPassword(appUser.password);
    }
    AppUsers.findByIdAndUpdate(id, appUser, { new: true }, function (err, doc) {
        delete doc.password;
        callback(err, doc);
    })
}

async function getAll(query) {
    let pageInfo = pageService.pageInfo(query)
    pageService.searchAny(query);
    pageInfo.data = await AppUsers.find(query).skip(pageService.skip(pageInfo)).limit(pageInfo.size);
    pageInfo.totalElements = await AppUsers.countDocuments(query);
    return pageInfo;
}

async function getOne(id) {
    if (ObjectId.isValid(id)) {
        return AppUsers.findById(id);
    } else {
        return AppUsers.findOne({ username: id });
    }
}


exports.create = create;
exports.getAll = getAll;
exports.getOne = getOne;
exports.update = update;