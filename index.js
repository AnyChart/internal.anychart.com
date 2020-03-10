#!/usr/bin/env node

const express = require('express');
const session = require('express-session');
const google = require('googleapis').google;
const bodyParser = require('body-parser')
const engines = require('consolidate');

const config = require(__dirname + '/config');
const Queries = require(__dirname + '/db/qureies');

const projects = require('./routes/projects');
const tasks = require('./routes/tasks');
const users = require('./routes/users');
const resources = require('./routes/resources');

const adminEmails = [
    'vitaly.radionov@anychart.com',
    'anton.kagakin@anychart.com'
]

const app = express();

app.use(session({
    secret: 'SomeSecretForSession',
    resave: true,
    saveUninitialized: true
}));

app.use(authChecker);

app.set('view options', {
    layout: false
});
app.set('views', __dirname + '/client');
app.engine('html', engines.mustache);
app.set('view engine', 'html');

app.use(express.static(__dirname + '/client'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.get('/', (req, res)=>{
    res.render('project-list.html');
});

app.get('/logs-data', (req, res)=>{
    const query = 'SELECT * FROM log_action ORDER BY date DESC LIMIT 0,100';
    Queries.query(query)
        .then(data => res.json(data))
})

app.get('/logs', (req, res)=>{
    res.render('logs.html');
});

app.use('/projects', projects);
app.use('/tasks', tasks);
app.use('/users', users);
app.use('/resources', resources);


app.listen(config.port, () => {
    console.log(`Anychart Gantt Project Editor server started! Listening port ${config.port}.`);
});

const OAuth2Data = require('./google_key.json')
const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;

function normalizeHost(host){
    if (host.includes('localhost')){
        return "dev.internal.com";
    }
    return host;
}

app.get('/oauth2', (req, res)=>{
    const code = req.query.code;
    const host = normalizeHost(req.headers.host);
    const REDIRECT_URL = OAuth2Data.web.redirect_uris.find(item => item.includes(host));
    const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL)

    if (code) {
        // Get an access token based on our OAuth code
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log('Error authenticating')
                console.log(err);
            } else {
                // console.log('Successfully authenticated');
                oAuth2Client.setCredentials(tokens);
                var oauth2 = google.oauth2({
                    auth: oAuth2Client,
                    version: 'v2'
                });
                req.session.auth = true;
                oauth2.userinfo.get(function (err, result) {
                    if (err) {
                        console.log(err);
                    } else {                        
                        if (result.data.hd != "anychart.com"){
                            res.json({error: "Wrong email adress!"});
                            req.session.auth = false;
                        }else{
                            req.session.googleUser = result.data;
                            req.session.googleUser.isAdmin = adminEmails.includes(result.data.email);
                            res.redirect(req.session.authCheckerBeforeURL);
                        }
                        
                    }
                });
            }
        });
    } else {
        if (!req.session.auth) {
            // Generate an OAuth URL and redirect there
            const url = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: [
                    'https://www.googleapis.com/auth/userinfo.profile',
                    'https://www.googleapis.com/auth/userinfo.email'
                ]
            });
            // console.log('>>> URL', url)
            res.redirect(url);
        } else {
            console.log('what a fck??')
            res.redirect(req.session.authCheckerBeforeURL);
        }
    }
});

app.get('/logout', (req, res)=> {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});

app.get('/curr-user', (req, res)=>{
    res.json(req.session.googleUser);
})

function authChecker(req, res, next) {
    if (req.session.auth || req.path === '/oauth2') {
        next();
    } else {
        req.session.authCheckerBeforeURL = req.path;
        res.redirect("/oauth2");
    }
}