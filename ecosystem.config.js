

module.exports = {
    apps: [
        {
            name: 'EnumServer',
            script: 'bin/run.js',
            env: {
                COMMON_VARIABLE: 'true',
            },
            env_production: {
                NODE_ENV: 'production'
            }
        }
    ],

    deploy: {
        production: {
            user: 'Desperado',
            host: '47.96.95.187',
            ref: 'origin/master',
            repo: 'git@github.com:KnowMighT/EnumServer.git',
            path: '/home/Desperado/BimLink/PM2Deploy',
            'post-deploy': 'npm install'
        },

        dev: {
            user: 'Desperado',
            host: '47.96.95.187',
            ref: 'origin/master',
            repo: 'git@github.com:KnowMighT/EnumServer.git',
            path: '/home/Desperado/BimLink/PM2Deploy',
            'post-deploy': 'npm install',
            env: {
                NODE_ENV: 'dev'
            }
        }
    }
};
