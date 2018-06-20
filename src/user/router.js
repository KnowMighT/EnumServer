
module.exports = router => {
    router.get('/users', getUsers);
    router.get('/user/:id', getUser);
    router.post('/users', addUser);
    router.put('/user/:id', updateUser);
    router.delete('/user/:id', deleteUser);
    router.get('/userFile/:id', getUserFile);
};

const User = require('./user');
const {queryFilter} = require('./../../tool');
const {Project} = require('../project');

function getUsers(req, res) {

    let filter = queryFilter(req);
    res.send_data(User.getUsers(filter));
}

function getUser(req, res) {
    let userId = req.params.id;
    res.send_data(User.getUserById(userId));
}

function addUser(req, res) {
    res.send_data(User.addUser(req.body));
}

function updateUser(req, res) {
    let userId = req.params.id;
    res.send_data(User.updateUser({userId}, req.body, null));
}

function deleteUser(req, res) {
    let userId = req.params.id;
    res.send_data(User.deleteUserById(userId));
}

async function getUserFile(req, res) {
    let userId = req.params.id;

    let {userInfo} = req.query;
    userInfo = JSON.parse(userInfo);

    let filter = queryFilter(req);
    filter.where.userId = userId;

    if (filter.where.ids) {
        filter.where._id = {$in: filter.where.ids};
    }

    let projects = await Project.getProjects(filter);
    res.send_data(User.getUserFile(userId, projects, userInfo));
}
