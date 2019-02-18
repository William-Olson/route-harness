const express = require('express');
const http = require('http');
const RouteHarness = require('../..');

const Users = require('./Users');
const Info = require('./Info');

// create express app
const app = express();

// ------- harness ----------

const harness =  new RouteHarness(app);

harness.use('/', Info);
harness.use('/users', Users);

// --------------------------

// set port
const port = process.env.PORT || '1333';
app.set('port', port);

// server
const server = http.createServer(app);
server.listen(port, function() { console.log('server listening on port: ' + port); });
