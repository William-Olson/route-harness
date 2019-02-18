const express = require('express');
const http = require('http');
const logger = require('debug');
const debug = logger('app');

const RouteHarness = require('../..');
const Users = require('./Users');
const Info = require('./Info');
const tester = { test: () => 'testing' };

// create express app
const app = express();

// ------- harness ----------

const harness =  new RouteHarness(app);
const harnessDependency = harness.asDependency();

const options = {
  inject: { logger, tester },

  // just do basic 1 param dependency injection
  factory: T => new T(harnessDependency),

  customWrapper: require('./custom')
};

harness.configure(options);

// create the routes with the harness
harness.use('/users', Users);
harness.use('/', Info);

// --------------------------

// set port
const port = process.env.PORT || '1333';
app.set('port', port);

// server
const server = http.createServer(app);
server.listen(port, function() { debug('server listening on port: ' + port); });
