#!/usr/bin/env node

const express = require('express');
const bodyParser = require('body-parser')
const engines = require('consolidate');

const config = require(__dirname + '/config');
const Queries = require(__dirname + '/db/qureies');

const projects = require('./routes/projects');
const tasks = require('./routes/tasks');
const users = require('./routes/users');
const resources = require('./routes/resources');

const app = express();
app.set('view options', { layout: false });
app.set('views', __dirname + '/client');
app.engine('html', engines.mustache);
app.set('view engine', 'html');

app.use(express.static(__dirname + '/client'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.render('/client/index.html');
});

app.use('/projects', projects);
app.use('/tasks', tasks);
app.use('/users', users);
app.use('/resources', resources);

app.listen(config.port, () => {
    console.log(`Anychart Gantt Project Editor server started! Listening port ${config.port}.`);
});