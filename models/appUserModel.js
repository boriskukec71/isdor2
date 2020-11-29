var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var AppUserSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: false },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    status: {
        type: String,
        enum: ['active', 'inactive', 'deleted'],
        default: 'active',
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'read'],
        default: 'user',
        required: true
    },
    createdAt: Date,
    createdBy: String,
    modifiedAt: Date,
    modifiedBy: String
});

module.exports = mongoose.model('AppUsers', AppUserSchema);