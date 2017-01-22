const express = require('express');

const Wrapper = require('./Wrapper');
const AsyncWrapper = require('./AsyncWrapper');

module.exports = class Harness {

  /**
   * Takes the express() instance as first parameter and options as 2nd.
   * Available options include 'async' (boolean), 'inject' (object), and
   * 'customWrapper' (function)
   */
  constructor(app, opts = {})
  {
    this._app = app;
    this._Wrapper = opts.async ? AsyncWrapper : Wrapper;
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
    const wrapper = new this._Wrapper(router, this._customWrap);

    let injectables = {};
    if (typeof this._injectables === 'object') {
      injectables = this._injectables;
    }

    const params = Object.assign({}, { harness: wrapper }, injectables);
    wrapper.wrapRoutes(new RouteClass(params), path);

    this._app.use(path, mdlwr, router);
  }

};
