var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var AppUserAccessLogSchema = new Schema({
    urlSlug: { type: String, required: true },
    username: String,
    role: String,
    time: Date,
    sourceIp: String,
    method: String,
    url: String,
    correlationId: String,
    requestParams: Schema.Types.Mixed,
    requestBody: Schema.Types.Mixed,
    responseBody: Schema.Types.Mixed,
    responseStatus: String,
    createdAt: Date,
    createdBy: String,
    modifiedAt: Date,
    modifiedBy: String
});

module.exports = mongoose.model('AppUserAccessLogs', AppUserAccessLogSchema);