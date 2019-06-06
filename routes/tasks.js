#!/usr/bin/env node

const express = require('express');
const router = express.Router();
const Queries = require(__dirname + '/../db/qureies');

/**
 * Returns list of tasks belonging to ptoject by id.
 */
router.get('/:projectId', (req, res) => {
    const projectId = req.params.projectId;
    Queries.getTasksByProjectId(projectId)
        .then(data => res.json(data))
        .catch(err => res.json({
            message: `Could not get tasks for project with id=${projectId}`,
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
        }));
});

/**
 * Updates task info.
 */
router.post('/update', (req, res) => {
    Queries.updateTask(req.body)
        .then(newTasks => res.json(newTasks))
        .catch(err => res.json({
            message: `Could not create task \"${req.body.name}\"`,
            error: err
        }));
});

module.exports = router;