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
        .then(data => res.json(data[0]))
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
    Queries.createTask(req.body)
        .then(newTasks => res.json(newTasks))
        .catch(err => res.json({
            message: `Could not create task \"${req.body.name}\"`,
            error: err
        }))
        .then((a) => {
            Queries.logAction({
                email: req.session.googleUser.email,
                action: 'Add',
                log: `Task ${req.body.id} (${JSON.stringify(req.body)})`
            })
        });
});

/**
 * Updates task info.
 */
router.post('/update', (req, res) => {
    Queries.updateTask(req.body)
        .then(newTasks => res.json(newTasks))
        .catch(err => res.json({
            message: `Could not update task \"${req.body.name}\"`,
            error: err
        }))
        .then((a) => {
            Queries.logAction({
                email: req.session.googleUser.email,
                action: 'update',
                log: `Task ${req.body.id} (${JSON.stringify(req.body)})`
            })
        });
});

module.exports = router;