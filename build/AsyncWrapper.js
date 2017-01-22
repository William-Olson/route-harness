function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const Wrapper = require('./Wrapper');

module.exports = class AsyncWrapper extends Wrapper {

  constructor(router, custom) {
    super(router, custom);
  }

  /**
   * Provides a wrapped function that calls next on errors and sends the
   * awaited return value of the wrapped function if no errors occur.
   */
  _wrap(fn, routeInfo) {
    return (() => {
      var _ref = _asyncToGenerator(function* (req, res, next) {
        try {
          req.routeInfo = routeInfo;
          const results = yield fn(req, res, next);
          if (results) {
            res.send(results);
          }
        } catch (err) {
          next(err);
        }
      });

      return function (_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      };
    })();
  }

};