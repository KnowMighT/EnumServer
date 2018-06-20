
const util = require('util');

function BimError(code, message) {
    this.code = code;
    this.message = message;

    this.jsonData = () => {
        return {
            code: this.code,
            message: this.message
        }
    };
}

util.inherits(BimError, Error);

module.exports = {

    /* 操作成功 */
    successInfo: (data) => {
        let info = {
            code: 0,
            message: 'OK'
        };
        info.data = data;
        return info;
    },

    deleteInfo: () => {
        return {
            code: 1,
            message: 'Delete succeed'
        }
    },

    /* 未知错误 */
    unKnownError: (message) => {
        return new BimError(10, message).jsonData();
    },

    /* 一般类型错误 */
    dataNullError: () => {
        return new BimError(11, 'Data is null');
    },

    appKeySecretError: () => {
        return new BimError(12, 'AppKey and appSecret must match');
    },

    /* 用户认证错误 */
    appKeyError: () => {
        return new BimError(50, 'AppKey is null')
    },

    appSecretError: () => {
        return new BimError(51, 'AppSecret is null')
    },

    userExistError: () => {
        return new BimError(52, 'User does not exist, please check your appKey');
    },

    userValidateError: () => {
        return new BimError(53, 'AppSecret is wrong');
    },

    userExpiredError: () => {
        return new BimError(54, 'User account expired')
    },

    tokenExistError: () => {
        return new BimError(55, 'Can not access without token');
    },

    tokenValidateError: () => {
        return new BimError(56, 'Failed to authenticate token.');
    },

    /* 业务逻辑错误 */
    projectIdError: () => {
        return new BimError(100, 'ProjectId is null');
    },

    projectsMaxCount: () => {
        return new BimError(101, 'The number of project in user has reached the maximum limit');
    },

    projectExistError: () => {
        return new BimError(102, 'Project is not Exist');
    },

    modelIdError: () => {
        return new BimError(150, 'ModelId is null');
    },

    modelNameSameError: () => {
        return new BimError(151, 'Model name has already existed');
    },

    modelPreprocessedError: () => {
        return new BimError(152, 'Model is waiting for preprocessed')
    },

    modelPreprocessedFailError: () => {
        return new BimError(153, 'Model is preprocessed unsuccessfully')
    },

    modelMaxCountError: () => {
        return new BimError(152, 'The number of model in Project has reached the maximum limit');
    },

    modelFileNotFoundError: () => {
        return new BimError(153, 'Model file is not exist')
    },

    modelExistError: () => {
        return new BimError(154, 'Model is not exist');
    }

};
