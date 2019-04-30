const connect = require('./connect');

class Queries { }

// ------- Common.
/**
 * Makes DB query.
 * @param {string} query - Query string.
 * @returns {Promise}
 */
Queries.makeQuery = function (query) {
    return connect()
        .then(pool => new Promise((resolve, reject) => {
            pool.query(query, (err, result, fields) => {
                err ? reject(err) : resolve(result);
            });
        }))
        .catch(err => {
            return Promise.reject(err);
        });
}

// ------- Project queries.
/**
 * Gets just inserted project.
 * @param {number} date - Modified date.
 * @private
 * @returns {Promise}
 */
Queries.getLastModifiedProject_ = function (date) {
    return Queries.makeQuery(`SELECT * FROM project WHERE last_modified=${date} LIMIT 1`);
}

/**
 * Gets all project.
 * @returns {Promise}
 */
Queries.getProjects = function () {
    return Queries.makeQuery('SELECT * FROM project ORDER BY last_modified DESC');
}

/**
 * Gets project by id.
 * @param {number} id - Project id.
 * @returns {Promise}
 */
Queries.getProjectById = function (id) {
    return Queries.makeQuery(`SELECT * FROM project WHERE id=${id}`);
}

/**
 * Insters new project record.
 * @param {string} name - Project name.
 * @returns {Promise}
 */
Queries.createProject = function (name) {
    const now = Date.now();
    return Queries.makeQuery(`INSERT INTO project (id, name, last_modified) VALUES (NULL, "${name}", ${now})`)
        .then(() => Queries.getLastModifiedProject_(now))
        .catch(err => Promise.reject(err))
        .then(lastModified =>Queries.getProjectById(lastModified[0].id));
}

// ------- Tasks queries.
/**
 * Gets tasks by project id.
 * @param {number} projectId - Project id.
 * @returns {Promise}
 */
Queries.getTasksByProjectId = function(projectId) {
    return Queries.makeQuery(`SELECT id, name, actualStart, actualEnd, progressValue, parent FROM task WHERE project=${projectId}`);
}

/**
 * Gets just inserted task.
 * @param {number} date - Modified date.
 * @private
 * @returns {Promise}
 */
Queries.getLastModifiedTask_ = function (date) {
    return Queries.makeQuery(`SELECT id, name, actualStart, actualEnd, progressValue, parent FROM task WHERE created_date=${date} LIMIT 1`);
}

/**
 * Gets project by id.
 * TODO TBA remaining fields.
 * @param {number} id - Project id.
 * @returns {Promise}
 */
Queries.getTaskById = function (id) {
    return Queries.makeQuery(`SELECT id, name, actualStart, actualEnd, progressValue, parent FROM task WHERE id=${id}`);
}


Queries.createTask = function (data) {
    const now = Date.now();
    const NULL = 'NULL';
    return Queries.makeQuery(`INSERT INTO task (id, name, actualStart, actualEnd, baselineStart, baselineEnd, progressValue, parent, project, created_date) VALUES (NULL, "${data.name}", ${data.actualStart}, ${data.actualEnd || NULL}, ${data.baselineStart || NULL}, ${data.baselineEnd || NULL}, ${+data.progress}, ${data.parent || NULL}, ${data.project}, ${now})`)
        .then(() => Queries.getLastModifiedTask_(now))
        .catch(err => Promise.reject(err))
        .then(lastModified =>Queries.getTaskById(lastModified[0].id));
}

module.exports = Queries;
