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

const harness =  new RouteHarness(app, {

  // logger dependency is injected via inject option
  inject: { logger },

  factory(T, args)
  {

    debug(`setting up new route-class ${T.name}`);

    // tester dependency is injected via our custom factory option
    args.tester = tester;

    return new T(args);

  },

  // use custom wrapper for some nice log output
  customWrapper: require('./custom')

});

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
