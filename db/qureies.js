const connect = require(__dirname+'/connect');
const NULL = 'NULL';

class Queries { }

// ------- Common.
/**
 * Makes DB query.
 * @param {string} query - Query string.
 * @returns {Promise}
 */
Queries.query = (query) => {
    return connect()
        .then(pc => new Promise((resolve, reject) => {
            // console.log(query); //TODO debuging queries.
            pc.pool.query(query, (err, result, fields) => {
                pc.connection.release();
                err ? reject(err) : resolve(result);
            });
        }))
        .catch(err => Promise.reject(err));
}

// ------- Project queries.
/**
 * Gets just inserted project.
 * @param {number} date - Modified date.
 * @private
 * @returns {Promise}
 */
Queries.getLastModifiedProject_ = (date) => {
    return Queries.query(`SELECT * FROM project WHERE last_modified=${date} LIMIT 1`);
}

/**
 * Gets all project.
 * @returns {Promise}
 */
Queries.getProjects = () => {
    return Queries.query('SELECT * FROM project WHERE deleted=0 ORDER BY last_modified DESC');
}

/**
 * Gets project by id.
 * @param {number} id - Project id.
 * @returns {Promise}
 */
Queries.getProjectById = (id) => {
    return Queries.query(`SELECT * FROM project WHERE id=${id}`);
}

/**
 * Insters new project record.
 * @param {string} name - Project name.
 * @returns {Promise}
 */
Queries.createProject = (name) => {
    const now = Date.now();
    return Queries.query(`INSERT INTO project (id, name, last_modified) VALUES (NULL, "${name}", ${now})`)
        .then(() => Queries.getLastModifiedProject_(now))
        .then(lastModified => Queries.getProjectById(lastModified[0].id))
        .catch(err => Promise.reject(err));
}

/**
 * Updates project data.
 * @param {Object} data - Project data.
 * @returns {Promise}
 */
Queries.updateProject = (data) => {
    const now = Date.now();
    return Queries.query(`UPDATE project SET name="${data.name}", last_modified=${now}, deleted="${data.deleted}" WHERE id=${data.id}`)
        .then(() => Queries.getLastModifiedProject_(now))
        .then(lastModified => Queries.getProjectById(lastModified[0].id))
        .catch(err => Promise.reject(err));
}

// ------- Users queries.

Queries.getUsers = () => {
    return Queries.query('SELECT * FROM user WHERE deleted=0 ORDER BY name');
}

/**
 * Gets just inserted user.
 * @param {number} date - Modified date.
 * @private
 * @returns {Promise}
 */
Queries.getLastModifiedUser_ = (date) => {
    return Queries.query(`SELECT * FROM user WHERE last_modified=${date} LIMIT 1`);
}

/**
 * Gets project by id.
 * @param {number} id - Project id.
 * @returns {Promise}
 */
Queries.getUserById = (id) => {
    return Queries.query(`SELECT * FROM user WHERE id=${id}`);
}

/**
 * Creates user.
 */
Queries.createUser = (data) => {
    const now = Date.now();
    return Queries.query(`INSERT INTO user (id, name, avatar, last_modified) VALUES (NULL, "${data.name}", "${data.avatar || '/images/banana.png'}", ${now})`)
        .then(() => Queries.getLastModifiedUser_(now))
        .then(lastModified => Queries.getUserById(lastModified[0].id))
        .catch(err => Promise.reject(err));
}

/**
 * Updates user data.
 * @param {Object} data - Project data.
 * @returns {Promise}
 */
Queries.updateUser = (data) => {
    const now = Date.now();
    return Queries.query(`UPDATE user SET name="${data.name}", last_modified=${now}, deleted="${data.deleted}", avatar="${data.avatar || NULL}" WHERE id=${data.id}`)
        .then(() => Queries.getLastModifiedUser_(now))
        .then(lastModified => Queries.getUserById(lastModified[0].id))
        .catch(err => Promise.reject(err));
}

// ------- Tasks queries.
/**
 * Deletes fields if are not set.
 * @param {Array.<Object>} - Incoming tasks.
 * @private
 * @returns {Promise}
 */
Queries.filterNulls_ = (tasks) => {
    tasks.forEach(task => {
        for (let key in task) {
            if (task[key] == null)
                delete task[key];
        }            
    });
    return Promise.resolve(tasks);
}


/**
 * Gets tasks by project id.
 * @param {number} projectId - Project id.
 * @returns {Promise}
 */
Queries.getTasksByProjectId = (projectId) => {
    const assignedTasksQuery = Queries.query(
        `SELECT task.*, 
            user.id AS userId, user.name AS userName, user.avatar AS userAvatar, user.deleted AS userDeleted
            FROM task, user
            WHERE task.project=${projectId} AND task.assignee=user.id AND task.deleted=0`);

    const notAssignedTasksQuery = Queries.query(
        `SELECT * FROM task WHERE task.project=${projectId} AND task.assignee IS NULL`
    );
                                
    return Promise
        .all([assignedTasksQuery, notAssignedTasksQuery])
        .then(values => Promise.resolve([].concat(...values))); //Combines two result arrays to a single one.
}


/**
 * Gets just inserted task.
 * @param {number} date - Modified date.
 * @private
 * @returns {Promise}
 */
Queries.getLastModifiedTask_ = (date) => {
    const assignedTaskQuery = `SELECT task.*, user.id AS userId, user.name AS userName, user.avatar AS userAvatar, 
                   user.deleted AS userDeleted
                   FROM task, user 
                   WHERE task.last_modified=${date} AND task.assignee=user.id LIMIT 1`;

    const notAssignedTasksQuery = `SELECT * FROM task where last_modified=${date} LIMIT 1`;

    return Queries
        .query(assignedTaskQuery)
        .then(data => data.length ? Promise.resolve(data) : Queries.query(notAssignedTasksQuery));
}

/**
 * Gets project by id.
 * TODO TBA remaining fields.
 * @param {number} id - Project id.
 * @returns {Promise}
 */
Queries.getTasksById = (id) => {
    return Queries
        .query(`SELECT * FROM task WHERE id=${id}`);
}

Queries.resetParent_ = (id) => {
    return Queries.query(`UPDATE task SET actualStart=NULL, actualEnd=NULL, progressValue=NULL WHERE id=${id}`);
}

Queries.resetParents_ = (parents = '[]') => {
    return Promise.all(JSON.parse(parents).map(id => Queries.resetParent_(id)));
}


Queries.createTask = (data) => {
    const now = Date.now();
    const url = data.url ? `"${data.url}"` : NULL;
    const query = `INSERT INTO
        task (id, name, url, assignee, actualStart, actualEnd, baselineStart, baselineEnd, progressValue, parent, project, last_modified)
        VALUES (NULL, "${data.name}", ${url}, ${data.assignee || NULL}, ${data.actualStart || NULL}, ${data.actualEnd || NULL}, ${data.baselineStart || NULL}, ${data.baselineEnd || NULL}, ${+data.progressValue}, ${data.parent || NULL}, ${data.project}, ${now})`;
    return Queries
        .resetParents_(data.parentsToReset)
        .then(() => Queries.query(query))    
        .then(() => Queries.getLastModifiedTask_(now))
        .catch(err => Promise.reject(err));
}


Queries.updateTask = (data) => {
    const now = Date.now();
    const url = data.url ? `"${data.url}"` : NULL;
    const query = `UPDATE task
        SET name="${data.name}", parent=${data.parent}, url=${url}, assignee=${data.assignee || NULL}, actualStart=${data.actualStart || NULL}, actualEnd=${data.actualEnd || NULL}, baselineStart=${data.baselineStart || NULL}, baselineEnd=${data.baselineEnd || NULL}, progressValue=${+data.progressValue}, last_modified=${now}, deleted=${data.deleted} WHERE id=${data.id}`;
    return Queries
        .query(query)
        .then(() => Queries.getLastModifiedTask_(now))
        .catch(err => Promise.reject(err));
}

module.exports = Queries;
