# route-harness

Simple harness for express that wraps all routes in a common error handler, and lets you define your routes using es6 classes.


```bash

 npm install --save route-harness

```


Benifits

 - no need for any try catch blocks in route function bodies
 - no need for `require('express')` in every single route file (in fact none will need this)
 - simplify route indentation and avoid callback hell by using async/await in route methods (all route methods are awaited by default)
 - customizable error handling that allows processing errors just the way you want
 - decoupled mounting of routes allowing a flexible way of initializing route paths and base paths
 - customized initialization of route classes via factory or inject options (pass the params you need to route class constructors)
 - easy and customizable logging of route interactions via the customWrapper option
 - pass in middleware to routes the same way you are familiar with
 - legible code that allows you to focus on only the important logic that each route implements


## Most basic usage

```javascript

const express = require('express');
const Harness = require('route-harness');

const app = express();

// just pass the express app to the harness
const harness = new Harness(app, { /* options */ });

// then define your routes
harness.use('/users', require('./routes/Users.js'));
// ...

```


_In your `./routes/Users.js` file:_

```javascript

module.exports = class UsersRoutes {

  constructor({ harness })
  {
    harness.get('/', this.getUsers);
    harness.get('/:id', [ /* someMiddleware */ ], this.getById);
  }

  async getUsers(req, res)
  {
    let users;

    // ...

    return users;
  }

  async getById(req)
  {
    const id = req.params.id;
    let user;

    // ...

    return user;
  }

};

```

## Factory Usage

Using the factory style, you can easily customize class constructors. As an example lets
provide a db param to all our route class constructors.


```javascript

// ...

const app = express();
const db = require('./some-db-client.js');

// init harness
const harness = new Harness(app);

// define the factory option, harness.restHarness is a provider for defining
// routes within your route classes
const opts = {
  factory: T => new T(harness.restHarness, db),
};

// set options
harness.configure(opts);

// we call mountRoutes instead of use here to register the class
harness.mountRoutes('/users', require('./routes/Users.js'));

```

_In `./routes/Users.js` file, follow your factory signature._

```javascript

module.exports = class UsersRoutes {

  constructor(restHarness, db)
  {
    this._db = db;

    // restHarness needs the this context which uses the class name
    // for properly wiring up subroutes to the base route path
    const harness = restHarness(this);

    harness.get('/:id', this.getById);
  }

  async getById(req)
  {
    const id = req.params.id;
    const user = await this._db.users.byId(id);

    if (!user) {
      throw new Error('User not found!');
    }

    return user;
  }

};


```

#### Return Values

If you return a value from your route class method, the value will be sent with the `res.send` method. Otherwise if a falsy value is returned (or there is no return value) you are expected to handle the response in the class method yourself.

If an error is thrown within a route class method, it will be caught and forwarded to the `next()` callback provided by express if you haven't provided the customWrapper option.

#### Class Parameters

**harness.use(...)**

You will by default get an object passed to your route class constructors containing a harness property. Note that this is not the same harness object that is returned from the `new Harness()` call.  The harness property on the param object allows you to define your routes with the `get, post, put, delete` methods.  The param object will also include any properties that were passed in with the `inject` option.

**harness.mountRoutes(...)**

When implementing the `harness.mountRoutes` style (rather than the `harness.use` approach), your route class constructors by default will get an object as a param.  This object will have any injectables provided via the inject options as well as a restHarness property for establishing your routes from within the constructor.

**factory option**

You provide params =)

#### Logging

There is nothing logged to the console by default.  You can provide the customWrapper option to handle logging however you please.

### Options:

All options are optional and calling `new Harness(app)` using 1 param is supported.

```javascript

const opts = {

  // custom route class instantiation
  factory: (T, args) => new T(args),

  // helpers passed to class constructors
  inject: { db, cheerio /*, ...etc. */ },

  // override default harness wrapper with a custom one
  customWrapper: (handler, info) => {

    const route = `${info.method} '${info.fullPath}'`;
    const name = `${info.routeClass}.${info.handler}`;

    console.log(`[harness] mapping: ${route} to ${name}`);

    return (req, res, next) => {

      console.log(`[harness] route hit: ${route} ${name}`);

      // call handler(req, res) here and handle errors and return values

    };
  }
};

```

- factory

  Provide a custom factory function if you want control over how your route classes are initialized. It takes a route class and injectables object as params and should return a new instance of that class. There will also be a restHarness property as a property of the injectables param for seting up routes from within the route class constructors.

- inject

  Inject option allows you to provide helpers or dependencies that will be passed as properties of the first parameter of the class constructor of your route files.

- customWrapper

  If you feel like using your own custom wrapper, you can provide the customWrapper option with a high order function that takes in a route class method as its param and returns an express looking function that will invoke the route class method in its body. It will also receive an info object as its second param which will contain properties describing the route being hit and the class and class method names being used.

