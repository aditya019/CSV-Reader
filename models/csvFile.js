const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const csvFileSchema = new Schema({
    name: String,
    profession: String,
    city: String
});

module.exports = mongoose.model('CsvFile', csvFileSchema);