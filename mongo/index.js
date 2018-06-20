
const mongoose = require('mongoose');
const config = require('../config');

module.exports = () => {
    mongoose.connect(config.mongodbURL);
    let db = mongoose.connection;
    db.on('error', e => {
        console.log(e.message);
    });
    db.on('open', () => {
        console.log('==> mongodb open succeed');
    });
};



