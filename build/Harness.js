const express = require('express');

module.exports = class Harness {

  /**
   * Takes the express() instance as first parameter and options as 2nd.
   * Available options include async (boolean), inject (object), and
   * customWrapper (function)
   */
  constructor(app, opts = {}) {
    this._app = app;
    this._router = express.Router();
    this._opts = opts;

    if (opts.async) {
      this._Wrapper = require('./AsyncWrapper');
    } else {
      this._Wrapper = require('./Wrapper');
    }
  }

  /**
   * Proxies the app.use method to instantiate the RouteClass and assign routes
   */
  use(path, mdlwr, RouteClass) {
    if (!RouteClass) {
      RouteClass = mdlwr;
      mdlwr = [];
    }
    const router = express.Router();
    const wrapper = new this._Wrapper(router, this._opts.customWrapper);

    let injectables = {};
    if (typeof this._opts.inject === 'object') {
      injectables = this._opts.inject;
    }

    const params = Object.assign({}, { harness: wrapper }, injectables);
    wrapper.wrapRoutes(new RouteClass(params));

    this._app.use(path, mdlwr, router);
  }

};