#!/usr/bin/env node

const express = require('express');
const router = express.Router();
const Queries = require(__dirname + '/../db/qureies');

/**
 * Gets project info by id.
 */
router.get('/:id', (req, res) => {
    const id = req.params.id;

    Queries.getProjectById(req.params.id)
        .then(projects => {
            res.render('project.html', { projectId: projects[0].id, projectName: projects[0].name });
        })
        .catch(err => res.json({
            message: `Could not get project with id=${id}`,
            error: err
        }));
});


/**
 * Returns all projects info.
 */
router.get('/', (req, res) => {
    Queries.getProjects()
        .then(data => res.json(data))
        .catch(err => res.json({
            message: 'Could not connect to database to fetch projects',
            error: err
        }));
});


router.post('/add', (req, res) => {
    const newProjectName = req.body.name;
    const action = req.body.action;
    if (action == 'empty') {
        console.log(action);
        Queries.createProject(newProjectName)
            .then(newProject => res.json(newProject[0]))
            .catch(err => res.json({
                message: `Could not create project \"${newProjectName}\"`,
                error: err
            }));
    } else {
        console.log(action);
        res.json({ message: action });
    }
});


router.post('/update', (req, res) => {
    Queries.updateProject(req.body)
        .then(result => res.json(result[0]))
        .catch(err => res.json({
            message: `Could not update project with id="${req.body.id}"`,
            error: err
        }));
});


module.exports = router;