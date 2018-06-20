const Project = require('./project');
const _ = require('lodash');
const {responseInfo, queryFilter} = require('./../../tool');

module.exports = function (router, middleware, controllers) {
    router.get('/projects/:id', getProject);
    router.get('/users/:id/projects', getProjects);
    router.post('/users/:id/projects', addProject);
    router.put('/projects/:id', updateProjectById);
    router.delete('/projects/:id', deleteProjectById);
}

function getProject(req, res) {
    let projectId = req.params.id;
    if (!projectId) {
        return send_data(responseInfo.projectIdError());
    }

    Project.getProjectById(projectId).then(project => {
        res.send_data(responseInfo.successInfo(project));
    }).catch(e => {
        if (e.constructor.name === 'BimError') {
            res.send_data(e.jsonData());
        } else {
            res.send_data(responseInfo.unKnownError(e.message));
        }
    });
}

function getProjects(req, res) {

    let filter = queryFilter(req);
    filter.where.userId = req.params.id;

    Project.getProjects(filter).then(projects => {
        res.send_data(responseInfo.successInfo(projects))
    }).catch(e => {
        if (e.constructor.name === 'BimError') {
            res.send_data(e.jsonData());
        } else {
            res.send_data(responseInfo.unKnownError(e.message));
        }
    });
}

function addProject(req, res) {

    let data = req.body;
    if (data && Object.getOwnPropertyNames(data).length === 0) {
        return res.send_data(responseInfo.dataNullError());
    }
    data.userId = req.params.id;

    Project.addProject(data).then(project => {
        res.send_data(responseInfo.successInfo(project));
    }).catch(e => {
        if (e.constructor.name === 'BimError') {
            res.send_data(e.jsonData());
        } else {
            res.send_data(responseInfo.unKnownError(e.message));
        }
    });
}

function updateProjectById(req, res) {

    let projectId = req.params.id;
    if (!projectId) {
        return send_data(responseInfo.projectIdError());
    }

    let data = req.body;
    if (data && Object.getOwnPropertyNames(data).length === 0) {
        return res.send_data(responseInfo.dataNullError());
    }

    Project.updateProjectById(projectId, data).then(project => {
        res.send_data(responseInfo.successInfo(project));
    }).catch(e => {
        if (e.constructor.name === 'BimError') {
            res.send_data(e.jsonData());
        } else {
            res.send_data(responseInfo.unKnownError(e.message));
        }
    });
}

function deleteProjectById(req, res) {

    let projectId = req.params.id;
    if (!projectId) {
        return send_data(responseInfo.projectIdError());
    }

    Project.removeProjectById(projectId).then(() => {
        res.send_data(responseInfo.deleteInfo());
    }).catch(e => {
        if (e.constructor.name === 'BimError') {
            res.send_data(e.jsonData());
        } else {
            res.send_data(responseInfo.unKnownError(e.message));
        }
    });
}
