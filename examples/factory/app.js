const express = require('express');
const logger = require('debug')
const debug = logger('app');
const path = require('path');
const Harness = require('../../');

// route files
const Users = require('./Users');
const Info = require('./Info');

const app = express();

const tester = { test: () => 'testing' };

// harness options
const opts = {

  inject: { logger },

  factory(T, args)
  {

    debug(`setting up new route-class ${T.name}`);
    args.tester = tester;
    return new T(args);

  },

  customWrapper: require('./custom')

};

// create harness
const harness =  new Harness(app, opts);

// define routes
harness.mountRoutes('/users', Users);
harness.mountRoutes('/', Info);


/*

  Error handlers

*/

app.use((req, res, next) => {

  const err = new Error('Not Found');
  err.status = 404;
  next(err);

});

app.use((err, req, res, next) => {

  res.locals.message = err.message;
  res.locals.error = err;

  res.status(err.status || 500);
  res.send({
    ok: false,
    error: res.locals
  });

});

module.exports = app;
