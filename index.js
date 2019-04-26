const express = require('express');
const config = require('./config');
const Queries = require('./db/qureies');

const app = express();
app.set('view options', { layout: false });
app.use(express.static(__dirname + '/client'));

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

app.listen(config.port, () => {
    console.log(`Anychart Gantt Project Editor server started! Listening port ${config.port}.`);
});