const mysql = require('mysql');
const config = require('../config');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: config.dbHost,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    port: config.dbPort
})

function connect() {
    // const con = mysql.createConnection({
    //     host: config.dbHost,
    //     user: config.dbUser,
    //     password: config.dbPassword,
    //     database: config.dbName,
    //     port: config.dbPort
    // });

    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            err ? reject(err) : resolve(pool);
        })
    });
}

module.exports = connect;
