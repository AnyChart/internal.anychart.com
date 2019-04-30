const express = require('express');
const bodyParser = require('body-parser')
const engines = require('consolidate');

const config = require('./config');
const Queries = require('./db/qureies');

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

app.get('/projects', (req, res) => {
    Queries.getProjects()
        .then(data => res.json(data))
        .catch(err => res.json({
            message: 'Could not connect to database',
            error: err
        }));
});

app.get('/p/:id', (req, res) => {
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

app.get('/tasks/:projectId', (req, res) => {
    const projectId = req.params.projectId;
    Queries.getTasksByProjectId(projectId)
        .then(data => res.json(data))
        .catch(err => res.json({
            message: `Could not get tasks for project with id=${projectId}`,
            error: err
        }));
});

app.post('/add-project', (req, res) => {
    const newProjectName = req.body.name;
    Queries.createProject(newProjectName)
        .then(newProject => res.json(newProject[0]))
        .catch(err => res.json({
            message: `Could not create project \"${newProjectName}\"`,
            error: err
        }));
});

app.post('/add-task', (req, res) => {
    Queries.createTask(req.body)
        .then(newTasks => res.json(newTasks))
        .catch(err => res.json({
            message: `Could not create task \"${req.body.name}\"`,
            error: err
        }));
});

app.listen(config.port, () => {
    console.log(`Anychart Gantt Project Editor server started! Listening port ${config.port}.`);
});