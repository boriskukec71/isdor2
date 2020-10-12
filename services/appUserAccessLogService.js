require('../connection/connection')
const AppUserAccessLogs = require('../models/appUserAccessLogModel');
const pageService = require('./pageService');


/// TODO create, and call create from logListener
// TODO create common serice methods
async function getAll(query) {
    let pageInfo = pageService.pageInfo(query)
    pageService.searchAny(query);
    pageInfo.data = await AppUserAccessLogs.find(query).skip(pageService.skip(pageInfo)).limit(pageInfo.size);
    pageInfo.totalElements = await AppUserAccessLogs.countDocuments(query);
    return pageInfo;
}

function getOne(id, callback) {
    AppUserAccessLogs.findById(id, function (err, doc) {
        callback(err, doc);
    });
}

///exports.create = create;
exports.getAll = getAll;
exports.getOne = getOne;