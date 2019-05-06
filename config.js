const fs = require('fs');

const LOCAL_CONFIG = './config.local.js'

const config = fs.existsSync(LOCAL_CONFIG) ?
    require('./config.local') :
    {
        port: 3000,
        dbHost: 'localhost',
        dbPort: 18889,
        dbUser: 'ac_project_user',
        dbName: 'ac_projects',
        dbPassword: 'ac_gantt_project_password'
    }

module.exports = config;




