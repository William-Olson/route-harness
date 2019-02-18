# route-harness

Simple express harness

- wraps all routes in a common error handler
- define your routes using es6 classes

```bash

 npm install --save route-harness

```


## Example

Just pass the express app to the harness, and start defining your route classes.

```javascript

const express = require('express');
const RouteHarness = require('route-harness');

const app = express();

const harness = new RouteHarness(app, { /* options */ });

harness.use('/users', require('./routes/Users.js'));


```


_In your `./routes/Users.js` file:_

```javascript

module.exports = class UsersRoutes {

  constructor(dependencies)
  {
    const router = dependencies.router;

    router.get('/', this.getUsers);
    router.get('/:id', this.getById);
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

#### Return Values

If you return a value from your route class method, the value will be sent with the `res.send` method. Otherwise if a falsy value is returned (or there is no return value) you are expected to handle the response in the class method yourself.

If an error is thrown within a route class method, it will be caught and forwarded to the `next()` callback provided by express if you haven't provided the customWrapper option.

#### Class Parameters

You will by default get an object passed to your route class constructors containing injected dependencies as properties. There will be a router property provided by route-harness. The router property allows you to define your sub-routes with the `get, post, put, delete` methods.

You can also customize what your constructors get injected with via the `factory` option.  The factory function will receive the route class as well as any injected dependencies as its parameters. The factory function expects the newly created class instance as its return value.  Note: You can use the injected router property for passing into your route classes here or use the harness dependency for fetching the router from within the class.

#### Logging

There is nothing logged to the console by default.  You can provide the customWrapper option to handle logging however you please.

## Advanced Options:

All options are optional and calling `new Harness(app)` using 1 param is supported.

```javascript

const opts = {

  // custom route class instantiation
  factory: (T, deps) => new T(deps),

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

  Inject option allows you to provide helpers or dependencies that will be passed as properties of the first parameter of the class constructor of your route files. If you are providing the custom factory option, these injected dependencies will be provided as the second argument to your factory function.

- customWrapper

  If you feel like using your own custom wrapper, you can provide the customWrapper option with a high order function that takes in a route class method as its param and returns an express looking function that will invoke the route class method in its body. It will also receive an info object as its second param which will contain properties describing the route being hit and the class and class method names being used.


## API

### RouteHarness

`new RouteHarness(app, options)`

`RouteHarness#use(routePath, [middleWare], RouteClass)`

`RouteHarness#asDependency()`


### Router

`Router#get(subPath, [middleWare], handlerMethod)`

`Router#put(subPath, [middleWare], handlerMethod)`

`Router#post(subPath, [middleWare], handlerMethod)`

`Router#delete(subPath, [middleWare], handlerMethod)`

### HarnessDependency

`HarnessDependency#getRouterForClass(className)`

`HarnessDependency#getDeps([className])`

