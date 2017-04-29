const express = require('express');
const Wrapper = require('./Wrapper');

const defaultFactory = (T, args) => new T(args);

module.exports = class Harness {

  /**
   * Takes the express() instance as first parameter and options as 2nd.
   * Available options include 'async' (boolean), 'inject' (object), and
   * 'customWrapper' (function)
   */
  constructor(app, opts = {})
  {
    this._app = app;
    this._async = opts.async;
    this._injectables = opts.inject;
    this._customWrap = opts.customWrapper;
    this._factory = opts.factory || defaultFactory;

  }

  /*

    Factory provider for a single use harness for instance mapping
    Note: This style is an alternative to this.use style

  */
  factory()
  {
    const router = express.Router();
    const wr = new Wrapper(router, this._customWrap, this._async);

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

    Mount base route path prior to router init

  */
  mount(path, mdlwr, RouteClass)
  {
    // TODO
  }


  /*

    Init a router and queue up a wrapper to use after class init

  */
  router()
  {
    // TODO
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
    const wrapper = new Wrapper(router, this._customWrap, this._async);

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

