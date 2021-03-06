//Require Mongoose
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

//Define a schema
var Schema = mongoose.Schema;

var FileSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  fileType: {
    type: String, 
    enum: ['file', 'folder'],
    required: true
  },
  ordinalNumber: {
    type: Number,
    required: true
  },
  isBinaryContent: Boolean,
  hasSearchFilter: Boolean,
  hasPresentationImage: Boolean,
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Files' },
  createdAt: Date,
  createdBy: String,
  content: { data: Buffer, contentType: String },
  presentation: { data: Buffer, contentType: String }
});

module.exports = mongoose.model('Files', FileSchema);