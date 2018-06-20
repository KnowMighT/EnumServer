
module.exports = {
    addUser,
    getUsers,
    getUserById,
    queryUser,
    updateUser,
    deleteUserById,
    getUserFile,
};

const User = require('./schema/user');
const {genAppKey, logger, responseInfo} = require('./../../tool');

async function getUserById(userId) {
    return User.queryById(userId);
}

async function queryUser(query, projection) {
    return User.queryOne(query, projection);
}

async function getUsers(filter = {}) {
    return User.applyFilter(filter);
}

async function addUser(data) {

    data.createdAt = new Date();
    data.updatedAt = new Date();
    let {appKey, appSecret} = {};

    if ((!data.appKey && data.appSecret) || (data.appKey && !data.appSecret)) {
        throw responseInfo.appKeySecretError();
    } else if (!data.appKey && !data.appSecret) {
        ({appKey, appSecret} = genAppKey.genAppKeyAndSecret());
        data.appKey = appKey;
    }

    console.log(`appKey=${appKey},appSecret=${appSecret}`);

    data.salt = genAppKey.csprng();
    data.appSecret = genAppKey.genSaveAppSecret(data.salt, appSecret);
    data.dataKeySecret = genAppKey.csprng();
    return User.add(data);
}

async function updateUser(query, data, upsert) {
    data.updatedAt = new Date();
    return User.update(query, data, upsert)
}

async function deleteUserById(id) {
    return User.removeById(id);
}

async function getUserFile(userId, projects=[], userInfo) {

    let data = {};

    let user = await getUserById(userId);

    if (userInfo) {
        data.projectVIP = user.projectVIP;
        data.expireAt = user.expireAt;
    }

    data.projects = [];

    projects.forEach(item => {
        data.projects.push({
            projectId: item._id,
            maxModelCount: item.maxModelCount
        });
    });

    let secret = genAppKey.aesEncrypt(JSON.stringify(data), user.dataKeySecret);

    console.log(JSON.parse(genAppKey.aesDecrypt(secret, user.dataKeySecret)));

    return secret;
}
