
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {BimModel} = require('./../../../tool');
const _ = require('lodash');

const user = new Schema({
    appKey: {
        type: String,
        index: true,
        required: true
    },
    appSecret: {
        type: String,
        required: true
    },
    salt: {//密码加盐值
        type: String,
        required: true
    },
    dataKeySecret: {
        type: String,
        required: true
    },
    projectVIP: Boolean,
    maxProjectCount: {//用户最大项目个数，默认50
        type: Number,
        default: 50
    },
    expireAt: Date,// 账号过期时间
    enterprise: String,//企业名
    createdAt: Date,
    updatedAt: Date
});

function allKeys() {
    return _.without(_.keys(user.paths), '__v');
}

user.methods.view = function () {
    return _.pick(this, allKeys());
};

user.statics.allKeys = function () {
    return '-__v -appKey -appSecret -salt';
};

user.statics.orderKey = function () {
    return '-createdAt';
};

module.exports = new BimModel(mongoose.model('user', user));
