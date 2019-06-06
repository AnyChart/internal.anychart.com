const fs = require('fs');

const LOCAL_CONFIG = __dirname + '/config.local.js'

const config = fs.existsSync(LOCAL_CONFIG) ?
    require(LOCAL_CONFIG.replace('.js','')) :
    {
        port: 3000,
        dbHost: 'localhost',
        dbPort: 3306,
        dbUser: 'dbUser',
        dbName: 'dbName',
        dbPassword: 'dbPassword'
    }

module.exports = config;




