
const express = require('express');

let router = express.Router();

router.get('/touch', (req, res) => {
    res.set('Access-Control-Expose-Headers', 'Strict-Transport-Security');
    res.json('touch');
});

router.post('/touch', (req, res) => {
    res.set('Access-Control-Expose-Headers', 'Strict-Transport-Security');
    res.json('touch');
});

router.get('/url', (req, res) => {
    res.send_data(`${req.protocol}://${req.get('host')}${req.originalUrl}`)
});

module.exports = router;
