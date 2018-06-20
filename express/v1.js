
const express = require('express');
const src = require('../src');

let router = express.Router();
src(router);

module.exports = router;
