const mysql = require('mysql');
const config = require('../config');

function connect() {
    const con = mysql.createConnection({
        host: config.dbHost,
        user: config.dbUser,
        password: config.dbPassword,
        database: config.dbName,
        port: config.dbPort
    });

    return new Promise((resolve, reject) => {
        con.connect(err => {
            err ? reject(err) : resolve(con);
        });
    });
}

module.exports = connect;
