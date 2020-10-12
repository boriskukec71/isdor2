///require('../connection/connection')
const AppUsers = require('../models/appUserModel');
const pageService = require('./pageService');
const ObjectId = require('mongoose').Types.ObjectId;


function create(appUser, callback) {
    AppUsers.create(appUser, function (err, docs) {
        callback(err, docs);
    })
}

function update(id, appUser, callback) {
    AppUsers.findByIdAndUpdate(id, appUser, { new: true }, function (err, docs) {
        callback(err, docs);
    })
}

async function getAll(query) {
    let pageInfo = pageService.pageInfo(query)
    pageService.searchAny(query);
    pageInfo.data = await AppUsers.find(query).skip(pageService.skip(pageInfo)).limit(pageInfo.size);
    pageInfo.totalElements = await AppUsers.countDocuments(query);
    return pageInfo;
}

function getOne(id, callback) {
    if (ObjectId.isValid(id)) {
        AppUsers.findById(id, function (err, doc) {
            callback(err, doc);
        });
    } else {
        AppUsers.findOne({ "username": id }, function (err, doc) {
            callback(err, doc);
        });
    }
}


exports.create = create;
exports.getAll = getAll;
exports.getOne = getOne;
exports.update = update;