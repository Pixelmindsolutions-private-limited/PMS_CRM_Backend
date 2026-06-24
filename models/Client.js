// models/Client.js
const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    name: String,
    mobile: String,
    email: String,
    address: String,
    lead: String
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;