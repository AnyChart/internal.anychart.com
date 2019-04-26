const connect = require('./connect');

class Queries { }

Queries.makeQuery = function (query) {
    return connect()
        .then(conn => new Promise((resolve, reject) => {
            conn.query(query, (err, result, fields) => {
                err ? reject(err) : resolve(result);
            })
        }))
        .catch(err => Promise.reject(err));
}

Queries.getProjects = function () {
    return Queries.makeQuery('SELECT * FROM project ORDER BY last_modified DESC');
}

module.exports = Queries;
