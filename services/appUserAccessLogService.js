require('../connection/connection.js');
const AppUserAccessLogs = require('../models/appUserAccessLogModel');
const pageService = require('./pageService');


 async function getAll(query) {
    let pageInfo = pageService.pageInfo(query)
    pageService.searchAny(query, ['urlSlug', 'requestParams', 'requestBody']);
    pageService.searchInterval(query, 'time');
    let sort = pageService.sortBy(query);
    if (Object.keys(sort).length === 0) {
        sort['time'] = -1;
    }
    pageInfo.data = await AppUserAccessLogs.find(query).sort(sort).skip(pageService.skip(pageInfo)).limit(pageInfo.size).exec();
    pageInfo.totalElements = await AppUserAccessLogs.countDocuments(query).exec();
    return pageInfo;
}

function getOne(id, callback) {
    AppUserAccessLogs.findById(id, function (err, doc) {
        callback(err, doc);
    });
}

module.exports = {
    getAll : getAll,
    getOne : getOne
}
