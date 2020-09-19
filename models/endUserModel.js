//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var EndUserSchema = new Schema({
  idNumber: {
    type: String,
    required: true
  },
  name: String,
  municipality: String,
  city: String,
  street: String,
  homeNo: String,
  userType: {
    type: String,
    enum: ['user', 'building', 'unknown'],
    default: 'user',
    required: true
  },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Files' },
  createdAt: Date,
  createdBy: String,
  modifiedAt: Date,
  modifiedby: String
});

/*
EndUserSchema.index({ idNumber: 'text', name: 'text', city: 'text', streetWithHomeNumber: 'text', municipality: 'text' });
db.endusers.createIndex({ idNumber: 'text', name: 'text', city: 'text', streetWithHomeNumber: 'text', municipality: 'text' }, {name: 'allFields'});
*/

module.exports = mongoose.model('EndUsers', EndUserSchema);