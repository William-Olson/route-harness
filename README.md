# route-harness

Simple harness for express that allows you to define your routes using classes.

```bash
npm install --save route-harness
```

## Usage

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


In your `./routes/Users.js` file:

```javascript
module.exports = class UsersRoutes {

  constructor({ harness })
  {
    harness.get('/', this.getUsers);
  }

  getUsers(req, res)
  {
    let users;

    // ...

    return users;
  }

};
```


#### Return Values

If you return a value from your route class method, the value will be sent with the `res.send` method. Otherwise if a falsy value is returned (or there is no return value) you are expected to handle the response in the class method yourself.

If an error is thrown within a route class method, it will be caught and forwarded to the `next()` callback provided by express if you haven't provided the customWrapper option.

#### Class Parameters

You will by default get an object passed to your route class constructors containing a harness property. Note that this is not the same harness object that is returned from the `new Harness()` call.  The harness property on the param object allows you to define your routes with the `get, post, put, delete` methods.  The param object will also include any properties that were passed in with the `inject` option.

#### Logging

There is nothing logged to the console by default.  You can provide the customWrapper option to handle logging however you please.

### Options:

All options are optional and calling `new Harness(app)` using 1 param is supported.

```javascript

const opts = {

  // enable awaiting on your class methods
  async: true,

  // helpers passed to class constructors
  inject: { db, cheerio /*, ...etc. */ },

  // override default harness wrapper with a custom one
  customWrapper: function(handler, info) {

    const route = `${info.method} '${info.fullPath}'`;
    const name = `${info.routeClass}.${info.handler}`;

    console.log(`[harness] mapping: ${route} to ${name}`);

    return function(req, res, next) {

      console.log(`[harness] route hit: ${route} ${name}`);

      // call handler(req, res) here and handle errors and return values

    };
  }
};

```

- async

  If you would like to use the default async/await wrapper you can provide the async option true. This assumes all your class methods will return a promise or are async functions. (requires babel or other async provider). The async option is ignored if the customWrapper option is provided since you can choose to await the handler yourself in the customWrapper's return function.

- inject

  Inject option allows you to provide helpers or dependencies that will be passed as properties of the first parameter of the class constructor of your route files.

- customWrapper

  If you feel like using your own custom wrapper, you can provide the customWrapper option with a high order function that takes in a route class method as its param and returns an express looking function that will invoke the route class method in its body. It will also receive an info object as its second param which will contain properties describing the route being hit and the class and class method names being used.

