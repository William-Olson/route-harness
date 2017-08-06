const express = require('express');
const path = require('path');
const Harness = require('../../');

const Users = require('./Users');
const Info = require('./Info');

const app = express();

const opts = {
  inject: {
    tester: {
      test: () => 'testing'
    }
  }
};

// create harness
const harness =  new Harness(app, opts);

// define routes
harness.use('/users', Users);
harness.use('/', Info);


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
    error: res.locals
  });

});

module.exports = app;
