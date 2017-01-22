const Wrapper = require('./Wrapper');

module.exports = class AsyncWrapper extends Wrapper
{

  constructor(router, custom)
  {
    super(router, custom);
  }

  /**
   * Provides a wrapped function that calls next on errors and sends the
   * awaited return value of the wrapped function if no errors occur.
   */
  _wrap(fn)
  {
    return async (req, res, next) => {
      try {
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

};
