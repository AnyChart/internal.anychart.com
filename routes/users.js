#!/usr/bin/env node

const express = require('express');
const router = express.Router();
const Queries = require(__dirname + '/../db/qureies');

/**
 * Renders users-list page.
 */
router.get('/', (req, res) => {
    res.render('users.html');
});

/**
 * Returns list of users.
 */
router.get('/data', (req, res) => {
    Queries.getUsers()
        .then(data => res.json(data))
        .catch(err => res.json({
            message: 'Could not fetch users from database',
            error: err
        }));
});

router.post('/add', (req, res) => {
    Queries.createUser(req.body)
        .then(newUser => res.json(newUser[0]))
        .catch(err => res.json({
            message: 'Could not create new user',
            error: err
        }));
});

router.post('/update', (req, res) => {
    Queries.updateUser(req.body)
        .then(result => res.json(result[0]))
        .catch(err => res.json({
            message: `Could not update user with id="${req.body.id}"`,
            error: err
        }));
});

module.exports = router;