
const {app, touch, v1} = require('./express');

touch.use('/touch', touch);
v1.use('/v1', v1);

let API_PRE = '/api';

app.use(API_PRE, touch);
app.use(API_PRE, v1);

app.use((req, res, next) => {
    res.json('There is no such api');
});

module.exports = app;
