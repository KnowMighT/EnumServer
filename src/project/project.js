module.exports = {
    addProject,
    updateProjectById,
    updateProject,
    updateMultiProject,
    removeProjectById,
    removeProjectBy,
    getProjects,
    getProjectById,
    queryProjects,
    queryOneProject,
    getCursor
}

const Project = require('./schema/project');
const _ = require('lodash');
const {responseInfo} = require('./../../tool');
const User = require('./../user/user');

async function addProject(data) {

    let user = await User.getUserById(data.userId);

    let projects = await getProjects({
        where: {userId: data.userId}
    });
    if (projects.length > user.maxProjectCount) {
        throw responseInfo.projectsMaxCount();
    }

    data.createdAt = new Date();
    data.updatedAt = new Date();
    return Project.add(data)
}

function updateProjectById(id, data, upsert) {
    data.updatedAt = new Date();
    return Project.updateById(id, data, upsert);
}

function updateProject(query, data, upsert) {
    data.updatedAt = new Date();
    return Project.update(query, data, upsert)
}

function updateMultiProject(query, data, upsert) {
    data.updatedAt = new Date();
    return Project.updateMulti(query, data, true, upsert)
}

function removeProjectById(id) {
    return Project.removeById(id)
}

function removeProjectBy(query) {
    return Project.removeBy(query)
}

function getProjects(filter = {}) {
    if (filter.only_count) {
        return getProjectsCount(filter.where)
            .then(count => ({count}));
    }
    return Project.applyFilter(filter)
}

function getProjectsCount(where = {}) {
    return Project.getCount(where);
}

function getProjectById(id, projection) {
    if (!id) return Promise.resolve(null)
    return Project.queryById(id, projection)
        .then(project => {
            return _.omit(project, ['__v', 'appKey', 'appSecret', 'salt'])
        })
}

function queryProjects(query, projection) {
    return Project.query(query, projection)
}

function queryOneProject(query, projection) {
    return Project.queryOne(query, projection)
}

function getCursor(where, projection) {
    return Project.cursor(where, projection);
}
