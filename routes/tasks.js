#!/usr/bin/env node

const express = require('express');
const router = express.Router();
const Queries = require(__dirname + '/../db/qureies');
const JiraClient = require("jira-connector");

/**
 * Returns list of tasks belonging to ptoject by id.
 */
router.get('/p/:projectId', (req, res) => {
    const jira = new JiraClient({
        host: "anychart.atlassian.net",
        basic_auth: {
            email: "vitaly.radionov@anychart.com",
            api_token: "LJ4kXceiXgBhFCjn35GZE2F4"
        }
    });

    const projectId = req.params.projectId;
    Queries.getTasksByProjectId(projectId)
        .then(data => {
            let jiraStatus = [];
            data.forEach((item, i) => {
                if (item.url) {
                    jiraStatus.push(
                        jira.issue
                        .getIssue({
                            issueKey: item.url
                        })
                        .then(issue => {
                            data[i].ticketStatus = issue.fields.status.name;
                            return data;
                        })
                    )
                }
            });
            return Promise.all(jiraStatus)
        })
        .then(data => res.json(data[0] || []))
        .catch(err => res.json({
            message: `Could not get tasks for project with id=${projectId}`,
            error: err
        }));
});

router.get('/roots', (req, res) => {
    Queries.getRootTaskNames()
        .then(data => res.json(data))
        .catch(err => res.json({
            message: 'Could not fetch root tasks',
            error: err
        }));
});

/**
 * Creates new task.
 */
router.post('/add', (req, res) => {
    let newTaskData = {};
    Queries.createTask(req.body)
        .then(newTasks => {
            newTaskData = newTasks[0];
            res.json(newTasks);
        })
        .catch(err => res.json({
            message: `Could not create task \"${req.body.name}\"`,
            error: err
        }))
        .then((a) => {
            Queries.logAction({
                email: req.session.googleUser.email,
                action: 'Add',
                log: `Task ${newTaskData.id} (${JSON.stringify(newTaskData)})`
            })
        });
});

/**
 * Helper function.
 * @param {*} obj1 
 * @param {*} obj2 
 */
function getTasksDiff(obj1, obj2) {
    const result = {};
    if (Object.is(obj1, obj2)) {
        return undefined;
    }
    if (!obj2 || typeof obj2 !== 'object') {
        return obj2;
    }
    Object.keys(obj1 || {}).concat(Object.keys(obj2 || {})).forEach(key => {
        if (key == 'last_modified') return;

        if (obj2[key] !== obj1[key] && !Object.is(obj1[key], obj2[key])) {
            if (["actualEnd","actualStart","baselineStart","baselineEnd"].includes(key)){
                result[key] = (new Date(obj2[key])).toDateString();
            }else{
                result[key] = obj2[key];
            }
        }
        if (typeof obj2[key] === 'object' && typeof obj1[key] === 'object') {
            if (obj1[key] || obj2[key]) {
                const value = getTasksDiff(obj1[key], obj2[key]);
                if (value !== undefined) {
                    result[key] = value;
                }
            }
        }
    });
    return result;
}

/**
 * Updates task info.
 */
router.post('/update', (req, res) => {
    Queries
        .getAssignedTaskById(req.body.id)
        .then(taskData => {
            const oldTaskData = taskData[0];
            let newTaskData = {};
            return Queries
                .updateTask(req.body)
                .then(newTasks => {
                    newTaskData = newTasks[0];
                    res.json(newTasks);
                })
                .catch(err => res.json({
                    message: `Could not update task \"${req.body.name}\"`,
                    error: err
                }))
                .then(() => {
                    const taskDiff = getTasksDiff(oldTaskData, newTaskData);
                    Queries.logAction({
                        email: req.session.googleUser.email,
                        action: 'update',
                        log: `Task ${req.body.id} (${JSON.stringify(taskDiff)})`
                    })
                });
        });
});

module.exports = router;