const express = require('express');
const Wrapper = require('./Wrapper');

const defaultFactory = (T, args) => new T(args);

module.exports = class Harness {

  /*

    Takes the express() instance as first parameter and options as 2nd.
    Available options include 'factory' (function), 'inject' (object), and
    'customWrapper' (function)

  */
  constructor(app, opts = {})
  {
    this._app = app;
    this._injectables = opts.inject;
    this._customWrap = opts.customWrapper;
    this._factory = opts.factory || defaultFactory;
    this._wrapQueue = [ ];

    // bound by default
    this.restHarness = this.restHarness.bind(this);
  }

  /*

    Allow setting of options at a later time

  */
  configure(opts)
  {
    this._injectables = opts.inject;
    this._customWrap = opts.customWrapper;
    this._factory = opts.factory || defaultFactory;
  }

  /*

    Factory provider for a single use harness for instance mapping
    Note: This style is an alternative to this.use and mountRoutes styles

  */
  factory()
  {
    const router = express.Router();
    const wr = new Wrapper(router, this._customWrap);

    const h = {
      get: wr.get.bind(wr),
      post: wr.post.bind(wr),
      put: wr.put.bind(wr),
      delete: wr.delete.bind(wr)
    };

    h.useInstance = (p, m, i) => {
      if (!i) {
        i = m;
        m = [];
      }
      wr.wrapRoutes(i, p);
      this._app.use(p, m, router);
    };

    return h;
  };

  /*

    Mount base route path (restHarness style)

  */
  mountRoutes(path, mdlwr, RouteClass)
  {
    if (!RouteClass) {
      RouteClass = mdlwr;
      mdlwr = [ ];
    }

    let injectables = {};
    if (typeof this._injectables === 'object') {
      injectables = this._injectables;
    }
    const restHarness = this.restHarness;
    const params = Object.assign({}, { restHarness }, injectables);

    // init the route class
    const routesInstance = this._factory(RouteClass, params);
    const name = routesInstance.constructor.name;

    // find the inited wrapper
    const initted = this._wrapQueue.find(q =>
      q.instance.constructor.name === name);

    if (!initted) {
      throw new Error('Must pass ${name} context to restHarness!');
    }

    initted.wrapper.wrapRoutes(routesInstance, path);
    this._app.use(path, mdlwr, initted.router);
  }

  /*

    Init a router and queue up a wrapper to use after class init

  */
  restHarness(routesInstance)
  {
    const router = express.Router();
    const wr = new Wrapper(router, this._customWrap);

    const restMounter = {
      get: wr.get.bind(wr),
      post: wr.post.bind(wr),
      put: wr.put.bind(wr),
      delete: wr.delete.bind(wr)
    };

    this._wrapQueue.push({
      wrapper: wr,
      router,
      instance: routesInstance
    });

    return restMounter;
  }

  /*

    Proxies the app.use method to instantiate the RouteClass and assign routes

  */
  use(path, mdlwr, RouteClass)
  {
    if (!RouteClass) {
      RouteClass = mdlwr;
      mdlwr = [];
    }
    const router = express.Router();
    const wrapper = new Wrapper(router, this._customWrap);

    let injectables = {};
    if (typeof this._injectables === 'object') {
      injectables = this._injectables;
    }

    const params = Object.assign({}, { harness: wrapper }, injectables);
    const routesInstance = this._factory(RouteClass, params);

    wrapper.wrapRoutes(routesInstance, path);

    this._app.use(path, mdlwr, router);
  }

};

