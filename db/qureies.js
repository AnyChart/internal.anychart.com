const connect = require(__dirname+'/connect');

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
    return Queries.query('SELECT * FROM project ORDER BY last_modified DESC');
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
        .then(lastModified =>Queries.getProjectById(lastModified[0].id))
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
 * Convert to resource.
 * @param {Array.<Object>} - Incoming tasks.
 * @private
 * @returns {Promise}
 */
Queries.task2resource = (tasks) => {
    let resources = {};
    let tsks = new Array(tasks.length);
    tasks.forEach(task => {
        tsks[task.id] = task;
    });
    tasks.forEach(task => {
        if (!task.leader) {
            if (task.parent){
                if (tsks[task.parent] && tsks[task.parent].leader)
                    task.leader = tsks[task.parent].leader;
                else 
                    task.leader = "unassigned";
            } else task.leader = "unassigned";
        }
        if (!resources[task.leader]){
            resources[task.leader] = {
                id: task.id,
                name: task.leader,
                periods:[]
            }
        }        
        if (task.actualStart || task.baselineStart){
            resources[task.leader]['periods'].push({
                name: task.name,
                id: task.id,
                start: task.actualStart || task.baselineStart,
                end: task.actualEnd || task.baselineEnd,
                parentName: (task.parent ? tsks[task.parent].name : '')
            })
        }
    });
    return Promise.resolve(Object.values(resources).sort((a,b)=>{return a.name > b.name}));
}

/**
 * Gets tasks by project id.
 * @param {number} projectId - Project id.
 * @returns {Promise}
 */
Queries.getTasksByProjectId = (projectId) => {
    return Queries
        .query(`SELECT * FROM task WHERE project=${projectId}`)
        .then(tasks => Queries.filterNulls_(tasks));
}

/**
 * Gets resources by project id.
 * @param {number} projectId - Project id.
 * @returns {Promise}
 */
Queries.getResourcesByProjectId = (projectId) => {
    return Queries
        .query(`SELECT * FROM task WHERE project=${projectId}`)
        .then(tasks => Queries.task2resource(tasks));
}

/**
 * Gets just inserted task.
 * @param {number} date - Modified date.
 * @private
 * @returns {Promise}
 */
Queries.getLastModifiedTask_ = (date) => {
    return Queries
        .query(`SELECT * FROM task WHERE last_modified=${date} LIMIT 1`)
        .then(tasks => Queries.filterNulls_(tasks));
}

/**
 * Gets project by id.
 * TODO TBA remaining fields.
 * @param {number} id - Project id.
 * @returns {Promise}
 */
Queries.getTasksById = (id) => {
    return Queries
        .query(`SELECT * FROM task WHERE id=${id}`)
        .then(tasks => Queries.filterNulls_(tasks));
}

Queries.resetParent_ = (id) => {
    return Queries.query(`UPDATE task SET actualStart=NULL, actualEnd=NULL, progressValue=NULL WHERE id=${id}`);
}

Queries.resetParents_ = (parents = '[]') => {
    //TODO Resettings parents is disabled for a while because of gantt bug.
    // return Promise.all(JSON.parse(parents).map(id => Queries.resetParent_(id)));

    return Promise.resolve();
}


Queries.createTask = (data) => {
    const now = Date.now();
    const NULL = 'NULL';
    const query = `INSERT INTO task (id, name, leader, actualStart, actualEnd, baselineStart, baselineEnd, progressValue, parent, project, last_modified) VALUES (NULL, "${data.name}", "${data.leader}", ${data.actualStart || NULL}, ${data.actualEnd || NULL}, ${data.baselineStart || NULL}, ${data.baselineEnd || NULL}, ${+data.progress}, ${data.parent || NULL}, ${data.project}, ${now})`;
    return Queries
        .resetParents_(data.parentsToReset)
        .then(() => Queries.query(query))    
        .then(() => Queries.getLastModifiedTask_(now))
        .then(tasks => Queries.getTasksById(tasks[0].id))
        .catch(err => Promise.reject(err));
}


Queries.updateTask = (data, parents) => {
    const now = Date.now();
    const NULL = 'NULL';
    const query = `UPDATE task SET name="${data.name}", leader="${data.leader}", actualStart=${data.actualStart || NULL}, actualEnd=${data.actualEnd || NULL}, baselineStart=${data.baselineStart || NULL}, baselineEnd=${data.baselineEnd || NULL}, progressValue=${+data.progress}, last_modified=${now} WHERE id=${data.id}`;
    return Queries
        .query(query)
        .then(() => Queries.getLastModifiedTask_(now))
        .then(tasks => Queries.getTasksById(tasks[0].id));
}

module.exports = Queries;
