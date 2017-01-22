# express-harness

Simple harness for express that allows you to define your route files as classes.

```bash
npm install --save express-harness
```

## Usage

```javascript
const express = require('express');
const Harness = require('express-harness');

const app = express();
const harness = new Harness(app, { /* options */ });

harness.use('/users', require('./routes/Users'));
harness.use('/', require('./routes/Main'));

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


### Options:

```javascript
{
  async: true,
  inject: { db, cheerio /* , helpers etc. */ },
  customWrapper: function(handler) {
    return function(req, res, next) {
      // call handler(req, res) here and handle errors or return values
    };
  }
}
```

- async

  If you would like to use the default async/await wrapper you can provide the async option true. This assumes all your class methods will return a promise or are async functions. (requires babel or other async provider).

- inject

  Inject option allows you to provide helpers or dependencies that will be passed to the class constructor of your route files.

- customWrapper

  If you feel like using your own custom wrapper, you can provide the customWrapper option with a high order function that takes in a route class method as its param and returns an express looking function that will invoke the route class method in its body.


#### Return Values

If you return a value from your route class method, the value will be sent with the `res.send` method. Otherwise if a falsy value is returned (or there is no return value) you are expected to handle the response in the class method yourself.

If an error is thrown within a route class method, it will be caught and forwarded to the `next()` callback provided by express if you haven't provided the customWrapper option.

#### Class Parameters

You will by default get an object passed to your route class constructors containing a harness property. Note that this is not the same harness object that is returned from the `new Harness()` call.  The harness property on the param object allows you to define your routes with the `get, post, put, delete` methods.  The param object may also contain any `inject` objects that are passed in with the options param in the `new Harness()` call.
