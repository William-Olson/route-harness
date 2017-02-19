const express = require('express');
const Wrapper = require('./Wrapper');

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
  }

  /**
   * Proxies the app.use method to instantiate the RouteClass and assign routes
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
    wrapper.wrapRoutes(new RouteClass(params), path);

    this._app.use(path, mdlwr, router);
  }

};
