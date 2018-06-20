
const http = require('http');
const app = require('../app');
const mongoDB = require('../mongo');

let server = http.Server(app);
server.listen(3000, e => {
    if (e) {
        console.log(e.message);
    } else {
        console.log('==> App start successfully')
    }
    mongoDB();
});




