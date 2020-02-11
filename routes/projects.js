#!/usr/bin/env node

const express = require('express');
const router = express.Router();
const Queries = require(__dirname + '/../db/qureies');

/**
 * Gets project info by id.
 */
router.get('/:id/:range?', (req, res) => {
    const id = req.params.id;
    const [min, max] = req.params.range ? req.params.range.split('-') : [NaN, NaN];

    Queries.getProjectById(req.params.id)
        .then(projects => {
            res.render('project.html', { projectId: projects[0].id, projectName: projects[0].name, min: min, max: max  });
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
    if (action == 'empty' || action == 'dummy') {
        Queries.createProject(newProjectName, req.body.tasks)
            .then(newProject => res.json(newProject[0]))
            .catch(err => res.json({
                message: `Could not create project \"${newProjectName}\"`,
                error: err
            }))
            .then((a) => {
                Queries.logAction({
                    email: req.session.googleUser.email,
                    action: 'Add',
                    log: `Project ${req.body.id} (${JSON.stringify(req.body)})`
                })
            });
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
        }))
        .then((a) => {
            Queries.logAction({
                email: req.session.googleUser.email,
                action: 'update',
                log: `Project ${req.body.id} (${JSON.stringify(req.body)})`
            })
        });
});


module.exports = router;