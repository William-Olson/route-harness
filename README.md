# route-harness

Simple harness for express that wraps all routes in a common error handler, and lets you define your routes using es6 classes.


```bash

 npm install --save route-harness

```


Benifits

 - customized initialization of route classes via factory or inject options (pass the params you need to route class constructors / perfect for abstracted dependency injection)
 - decoupled mounting of routes allowing a flexible way of initializing route paths and base paths
 - no need for `require('express')` in every single route file (in fact none will need this)
 - write legible code that allows you to focus on only the important logic that each route implements
 - simplify route indentation and avoid callback hell by using async/await in route methods
 - customizable error handling that allows processing errors in a centralized location just the way you want
 - no try/catch blocks in route function bodies needed just throw and let it bubble up to the customWrapper
 - easy and customizable logging of route interactions via the customWrapper option
 - pass in middleware to routes the same way you are familiar with in express


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

  constructor(args)
  {
    // the route path mapper comes in the args by default
    const harness = args.harness;

    harness.get('/', this.getUsers);
    harness.get('/:id', [ /* someMiddleware */ ], this.getById);

    // you can use your inject options here as well
    // this.myInjectedDependency = args.myInjectedDependency;
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

Using the factory style approach, you can easily customize class constructors
(Note that this approach is a bit different from the basic usage example above).


As an example lets provide a db param to all our route class constructors.


```javascript
const express = require('express');
const Harness = require('route-harness');

// assuming you have some database client dependency
const db = require('./some-db-client.js');

// ...

const app = express();

// init harness
const harness = new Harness(app, {

  // Define the factory option...
  //
  // The first argument of this function is the RouteClass that you instantiate
  // in your own custom way, the second argument is the object containing the
  // inject data.
  //
  // There will be a restHarness object injected by default for mapping the endpoint paths
  // from within the class.

  factory: (T, injectedArgs) => new T(injectedArgs.restHarness, db),

});

// we call `mountRoutes` instead of `use` here..
// this tells the route-harness to register it but not instantiate it
harness.mountRoutes('/users', require('./routes/Users.js'));

```

_In `./routes/Users.js` file, follow your factory signature._

```javascript

module.exports = class UsersRoutes {

  constructor(restHarness, db)
  {
    this._db = db;

    // restHarness needs the `this` context which uses the class name
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

##### When using the _harness.use(...)_ approach

You will by default get an object passed to your route class constructors containing a harness property. Note that this is not the same harness object that is returned from the `new Harness()` call.  The harness property on the param object allows you to define your routes with the `get, post, put, delete` methods.  The param object will also include any properties that were passed in with the `inject` option.

##### When using the _harness.mountRoutes(...)_ approach

When implementing the `harness.mountRoutes` style (rather than the `harness.use` approach), your route class constructors by default will get an object as a param.  This object will have any injectables provided via the inject options as well as a restHarness property for establishing your routes from within the constructor.

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
  customWrapper: (handler, info, injectedProps) => {

    const route = `${info.method} '${info.fullPath}'`;
    const name = `${info.routeClass}.${info.handler}`;

    console.log(`[harness] mapping: ${route} to ${name}`);

    return async (req, res, next) => {

      console.log(`[harness] route hit: ${route} ${name}`);

      // call the handler here and process errors and return values
      try {
        const result = await handler(req, res);
        if (result) {
          res.send(result);
        }
      }
      catch (error) {
        console.error(`[harness] error in route ${route}: `, error);
        next(error);
      }

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

