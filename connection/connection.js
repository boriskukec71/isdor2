const mongoose = require('mongoose');
const connectionString = 'mongodb://127.0.0.1/termoplinArhiva';
const db = mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });

module.exports = db;