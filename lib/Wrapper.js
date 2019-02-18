
module.exports = class Wrapper {

  /*

     Takes an express.Router(), and optional custom wrap function. Adds the get,
     post, put, & delete routing methods as a proxy to queue up wrapping the
     routes at a later time.

  */
  constructor(router, custom)
  {
    this._router = router;
    this._custom = custom;
    this._queued = [];

    for (let method of [ 'get', 'post', 'put', 'delete' ]) {
      this[method] = (path, mdlwr, fn) => this._queue(method, path, mdlwr, fn);
    }
  }

  /*

    Takes an instance of a routes file class.
    Calls the express router methods and wraps the callbacks.

  */
  wrapRoutes(routes, parentPath, injectables = {})
  {
    const wrap = this._custom || this._asyncWrap;

    for (let route of this._queued) {
      const { type: method, path, mdlwr, fn } = route;

      if (!path) {
        throw new Error('Missing route path in definition');
      }

      if (!fn || !fn.name) {
        throw new Error(`Missing named function for route: ${`${parentPath}${path}`.replace(/\/\//g, '/')}`)
      }

      // provide route info to the wrapper
      const routeInfo = {
        method: method,
        fullPath: `${parentPath}${path}`.replace(/\/\//g, '/'),
        basePath: parentPath,
        subPath: path,
        routeClass: routes.constructor.name,
        handler: fn.name
      };

      this._router[method](path, mdlwr, wrap(fn.bind(routes), routeInfo, injectables));
    }
  }

  /*

    Provides a wrapped function that calls next on errors and sends the
    awaited return value of the wrapped function if no errors occur.

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

  /*

    Adds a route to the to-be-wrapped queue.

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
