
module.exports = class Wrapper {

  /**
   * Takes an expres.Router() instance as a param. Adds the get, post, put, & 
   * delete routing methods as a proxy to queue up wrapping the routes at a
   * later time.
   */
  constructor(router, custom) {
    this._router = router;
    this._custom = custom;
    this._queued = [];

    for (let proto of ['get', 'post', 'put', 'delete']) {
      this[proto] = (path, mdlwr, fn) => this._queue(proto, path, mdlwr, fn);
    }
  }

  /**
   * Takes an instance of a routes file class.
   * Calls the express router methods and wraps the callbacks.
   */
  wrapRoutes(routes) {
    const wrap = this._custom || this._wrap;
    for (let route of this._queued) {
      const { type, path, mdlwr, fn } = route;
      this._router[type](path, mdlwr, wrap(fn.bind(routes)));
    }
  }

  /**
   * Provides a wrapped function that calls next on errors and sends the return
   * value of the wrapped function if no errors occur.
   */
  _wrap(fn) {
    return (req, res, next) => {

      try {

        const result = fn(req, res, next);

        if (result) {
          res.send(result);
        }
      } catch (err) {
        next(err);
      }
    };
  }

  /**
   * Adds a route to the to-be-wrapped queue.
   */
  _queue(type, path, mdlwr, fn) {
    if (!fn) {
      fn = mdlwr;
      mdlwr = [];
    }

    this._queued.push({ type, mdlwr, path, fn });
  }

};