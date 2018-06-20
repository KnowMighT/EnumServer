module.exports = {
    randomString,
    csprng,
    genAppKeyAndSecret,
    sha256,
    genSaveAppSecret,
    aesEncrypt,
    aesDecrypt
}

const crypto = require('crypto');
const Seq = require('sequin');

const DEFAULT_BITS = 512;
const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const maxPos = DIGITS.length;

const rnd = seed => (((seed * 9301) + 49297) % 233280) / (233280.0);
const rand = number => Math.floor(rnd(new Date().getTime() * Math.random()) * number);

function sha256(str) {
    return crypto.createHash('sha256').update(`${str}`).digest('hex');
}

function randomString(len = 36) {
    let pwd = '';
    for (let i = 0; i < len; i += 1) {
        pwd += DIGITS.charAt(rand(maxPos));
    }
    return pwd;
}

function csprng(bits, radix) {
    bits = bits || DEFAULT_BITS;
    radix = radix || maxPos;

    if (radix < 2 || radix > maxPos)
        throw new Error(`radix argument must be between 2 and ${maxPos}`);

    let length = Math.ceil(bits * Math.log(2) / Math.log(radix)),
        entropy = crypto.randomBytes(bits),
        stream = new Seq(entropy),
        string = '';

    while (string.length < length)
        string += DIGITS[stream.generate(radix)];

    return string;
}

function genAppKeyAndSecret(keyLength = 36) {
    let appKey = randomString(keyLength);
    let appSecret = randomString(keyLength);
    appSecret = sha256(csprng() + appSecret);
    return {appKey, appSecret};
}

function genSaveAppSecret(salt, appSecret) {
    return sha256(salt + '.' + appSecret);
}


/* 数据加密 */

function aesEncrypt(data, key) {
    const cipher = crypto.createCipher('aes192', key);
    let crypted = cipher.update(data, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

function aesDecrypt(encrypted, key) {
    const decipher = crypto.createDecipher('aes192', key);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
