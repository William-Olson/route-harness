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

    // bind the routerFactory
    this._routerFactory = this._routerFactory.bind(this);
  }

  /*

    Allow setting of options at a later time

  */
  configure(opts)
  {
    this._injectables = opts.inject || this._injectables;
    this._customWrap = opts.customWrapper || this._customWrap;
    this._factory = opts.factory || this._factory;
  }

  /*

    Allow using the routerHarness as a dependency

    Note: once you have it in a route class, you can use it via

    const r = router.getRouterForClass(this.constructor.name);
    r.get('/some-route/, this.someRouteMethod);

    // ...or getting the injected dependencies

    const deps = router.getDeps(this.constructor.name);

  */
  asDependency()
  {

    return this._routerFactory();

  }

  /*

    Create a router object to define subroutes with
    that has an expressRouter and wrapper tied to it

  */
  _routerFactory(injectables)
  {

    const router = express.Router();
    const wrapper = new Wrapper(router, this._customWrap);

    const harnessRouter = { };
    harnessRouter.get    = wrapper.get.bind(wrapper),
    harnessRouter.post   = wrapper.post.bind(wrapper),
    harnessRouter.put    = wrapper.put.bind(wrapper),
    harnessRouter.delete = wrapper.delete.bind(wrapper)

    // get the router for a route class
    harnessRouter.getRouterForClass = className => {


      const entry = this._wrapQueue.find(e => e.className === className);

      if (!entry) {
        throw new Error(`Can't find router for class: ${className}`);
      }

      return entry.data.router;

    }

    // get injected dependencies
    harnessRouter.getDeps = className => {

      if (!this._wrapQueue || !this._wrapQueue.length) {
        throw new Error('Problem fetching dependencies, no routes found');
      }

      if (!className) {
        className = this._wrapQueue[0].className;
      }

      const entry = this._wrapQueue.find(e => e.className === className);

      if (!entry) {
        throw new Error('Problem fetching dependencies');
      }

      return entry.data;

    }

    // map the routes base path and sub paths
    harnessRouter._useInstance = (parentPath, middleWare, routeClassInstance) => {
      if (!routeClassInstance) {
        routeClassInstance = middleWare;
        middleWare = [];
      }
      wrapper.wrapRoutes(routeClassInstance, parentPath, injectables);
      this._app.use(parentPath, middleWare, router);
    };

    harnessRouter._useInstance = harnessRouter._useInstance.bind(this);
    harnessRouter.getRouterForClass = harnessRouter.getRouterForClass.bind(this);
    harnessRouter.getDeps = harnessRouter.getDeps.bind(this);

    return harnessRouter;
  };

  /*

    Assigns routes by initializing the RouteClass and
    mapping the base path / base middleware to defined
    subroutes / subroute middleware

  */
  async use(path, mdlwr, RouteClass)
  {
    if (!RouteClass) {
      RouteClass = mdlwr;
      mdlwr = [];
    }

    let injectables = {};
    if (typeof this._injectables === 'object') {
      injectables = this._injectables;
    }

    // add the router for defining sub-routes within the constructor
    const router = this._routerFactory(injectables);
    const params = Object.assign({}, { router }, injectables);

    try {

      // allow fetching routers and deps in class constructors
      const queueEntry = { className: RouteClass.name, data: params };
      this._wrapQueue.push(queueEntry);

      // initialize the route class instance via provided or default factory
      const routesInstance = await this._factory(RouteClass, params);

      // after sub-routes are defined, map the base path and middleware
      params.router._useInstance(path, mdlwr, routesInstance);
    }
    catch (e) {
      console.error(`Problem creating routes ${path} (${RouteClass.name})`, e);
    }


  }

};

