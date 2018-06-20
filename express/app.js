
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('../config');
const helmet = require('helmet');
const msgpack = require('msgpack-lite');
const zlib = require('zlib');

let app = express();

app.set('trust proxy', true);
app.use(bodyParser.json({limit: config.max_body}));// content-type: application/json
app.use(bodyParser.urlencoded({extended: true})); // content-type: urlencoded
app.use(bodyParser.raw({limit: config.max_body})); // content-type: application/octet-stream
app.use(bodyParser.text()); // content-type: text/plain
app.use(cookieParser());
app.use(helmet({}));
app.disable('x-powered-by');
app.disable('etag');

app.use((req, res, next) => {
    req.body_empty = body_empty;
    res.send_data = send_data;
    res.send_err = send_err;
    res.send_file = send_file;
    res.send_buf = send_buf;
    res.remove = remove;
    res.send_msgpack = send_msgpack;
    next();

    function send_buf(data) {
        if ('function' !== typeof data.then) {
            res.send(data);
        } else {
            data.then(response => res.send(response))
                .catch(err => {
                    res.status(400).json(err);
                });
        }
    }

    function send_err(err) {
        res.status(400).json(err);
    }

    function body_empty() {
        if (!req.body) {
            res.status(400).json(new Error('req.body is empty'));
            return true;
        }
        return false;
    }

    function send_data(data) {
        if ('function' !== typeof data.then) {
            res.json(data);
        } else {
            data.then(response => res.json(response))
                .catch(err => {
                    res.status(400).json(err);
                });
        }
    }

    function send_file(data, options) {
        if ('function' !== typeof data.then) {
            send(data);
            return;
        }

        data.then(send)
            .catch(err => {
                res.status(400).json(err);
            });

        function send(file) {
            res.sendFile(file, options, err => {
                if (err) {
                    res.status(err.status)
                }
            });
        }
    }

    function remove(action) {
        if ('function' !== typeof action.then) {
            res.sendStatus(204);
            return;
        }
        action.then(() => res.sendStatus(204))
            .catch(err => res.status(400).json(err));
    }

    function send_msgpack(data) {
        if ('function' !== typeof data.then) {
            return job(data);
        } else {
            return data.then(job);
        }

        function job(data) {
            return zipBuf(msgpack.encode(data))
                .then(data => res.send(data))
                .catch(err => {
                    res.status(400).json(err);
                });
        }
    }

    async function zipBuf(buf) {
        let acceptEncoding = req.headers['accept-encoding'];
        if (!acceptEncoding) {
            return buf;
        }

        // 优先考虑使用gzip压缩方式，IE bug
        // http://stackoverflow.com/questions/26722478/app-does-not-load-in-internet-explorer/26723126#26723126

        if (acceptEncoding.match(/\bgzip\b/)) {
            res.set({'Content-Encoding': 'gzip'});
            return new Promise((resolve, reject) => {
                zlib.gzip(buf, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });

        } else if (acceptEncoding.match(/\bdeflate\b/)) {
            res.set({'Content-Encoding': 'deflate'});
            return zlib.deflate(buf);
        } else {
            return buf;
        }
    }
});

module.exports = app;
