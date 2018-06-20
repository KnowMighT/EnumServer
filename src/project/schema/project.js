const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.ObjectId;
const {BimModel} = require('./../../../tool');
const _ = require('lodash');

const project = new Schema({
    userId: {
        index: true,
        required: true,
        type: ObjectId
    },
    name: String,//项目名
    maxModelCount: {//项目下最大模型个数，默认50
        type: Number,
        default: 50
    },
    createdAt: Date,
    updatedAt: Date
});

function allKeys() {
    return _.without(_.keys(project.paths), '__v');
}

project.methods.view = function () {
    return _.pick(this, allKeys());
};

project.statics.allKeys = function () {
    return '-__v';
};

project.statics.orderKey = function () {
    return '-updatedAt';
};

module.exports = new BimModel(mongoose.model('Project', project));
