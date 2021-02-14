const mongoose = require('mongoose');

const { Schema } = mongoose;

const EndUserSchema = new Schema({
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
},
  { collation: { locale: 'hr', strength: 2 } });

module.exports = mongoose.model('EndUsers', EndUserSchema);