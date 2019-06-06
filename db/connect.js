const mysql = require('mysql');
const config = require(__dirname + '/../config');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: config.dbHost,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    port: config.dbPort
})

function connect() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            // TODO: Connections degugging:
            // console.log('Free connections:' + pool._freeConnections.length);
            // console.log('All connections:' + pool._allConnections.length);
            // console.log('Acquiring connections:' + pool._acquiringConnections.length);
            err ? reject(err) : resolve({pool: pool, connection: connection});
        })
    });
}

module.exports = connect;
