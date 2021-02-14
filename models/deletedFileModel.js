const mongoose = require('mongoose');

const { Schema } = mongoose;

const DeletedFileSchema = new Schema({
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
  presentation: { data: Buffer, contentType: String },
  parentDeletedFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'DeletedFiles' },
  createdAt: Date,
  createdBy: String,
});

module.exports = mongoose.model('DeletedFiles', DeletedFileSchema);