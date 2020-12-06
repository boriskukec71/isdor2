//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
var Schema = mongoose.Schema;

var ImportSchema = new Schema({
  importLocation: {
    type: String,
    required: true
  },
  type: {
    type: String, 
    enum: ['file', 'folder'],
    required: true
  },
  status: {
    type: String, 
    enum: ['inProgress', 'done', 'waiting', 'error'],
    required: true
  },
  createdAt: Date,
  createdBy: String
});

module.exports = mongoose.model('Imports', ImportSchema);