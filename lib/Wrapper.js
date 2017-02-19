
module.exports = class Wrapper {

  /**
   * Takes an express.Router(), a custom wrap function, and a bool for
   * determining if wrapped methods should be awaited. Adds the get, post, put,
   * & delete routing methods as a proxy to queue up wrapping the routes at a
   * later time.
   */
  constructor(router, custom, isAsync)
  {
    this._router = router;
    this._custom = custom;
    this._isAsync = isAsync;
    this._queued = [];

    for (let proto of [ 'get', 'post', 'put', 'delete' ]) {
      this[proto] = (path, mdlwr, fn) => this._queue(proto, path, mdlwr, fn);
    }
  }

  /**
   * Takes an instance of a routes file class.
   * Calls the express router methods and wraps the callbacks.
   */
  wrapRoutes(routes, parentPath)
  {
    let wrap = this._isAsync ? this._asyncWrap : this._wrap;

    if (this._custom) {
      wrap = this._custom;
    }

    for (let route of this._queued) {
      const { type, path, mdlwr, fn } = route;

      // provide route info to the wrapper
      const routeInfo = {
        method: type,
        fullPath: `${parentPath}${path}`.replace(/\/\//g, '/'),
        basePath: parentPath,
        subPath: path,
        routeClass: routes.constructor.name,
        handler: fn.name
      };

      this._router[type](path, mdlwr, wrap(fn.bind(routes), routeInfo));
    }
  }

  /**
   * Provides a wrapped function that calls next on errors and sends the return
   * value of the wrapped function if no errors occur.
   */
  _wrap(fn, routeInfo)
  {
    return (req, res, next) => {

      try {

        req.routeInfo = routeInfo;
        const result = fn(req, res, next);

        if (result) {
          res.send(result);
        }

      }
      catch (err) {
        next(err);
      }

    };
  }

  /**
   * Provides a wrapped function that calls next on errors and sends the
   * awaited return value of the wrapped function if no errors occur.
   */
  _asyncWrap(fn, routeInfo)
  {
    return async (req, res, next) => {
      try {
        req.routeInfo = routeInfo;
        const results = await fn(req, res, next);
        if (results) {
          res.send(results);
        }
      }
      catch (err) {
        next(err);
      }
    };
  }

  /**
   * Adds a route to the to-be-wrapped queue.
   */
  _queue(type, path, mdlwr, fn)
  {
    if (!fn) {
      fn = mdlwr;
      mdlwr = [];
    }

    this._queued.push({ type, mdlwr, path, fn });
  }

};
