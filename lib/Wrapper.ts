import { Handler, Request, Response, NextFunction, Router } from 'express';
import { CustomWrapper, Injectables, RouteInformation, WrappedHandler, WireUpFunction } from './Types';

type HttpMethod = 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head';

interface QueuedRouteHandler {
  type: HttpMethod;
  path: string;
  mdlwr: WrappedHandler[];
  fn: WrappedHandler;
}

export class Wrapper<T> {
  private _router: Router;
  private _custom: CustomWrapper;
  private _queued: QueuedRouteHandler[];

  public get: WireUpFunction;
  public post: WireUpFunction;
  public put: WireUpFunction;
  public delete: WireUpFunction;
  public patch: WireUpFunction;
  public all: WireUpFunction;
  public options: WireUpFunction;
  public head: WireUpFunction;

  /*

     Takes an express.Router(), and optional custom wrap function. Adds the get,
     post, put, & delete routing methods as a proxy to queue up wrapping the
     routes at a later time.

  */
  constructor(router: Router, custom?: CustomWrapper) {
    this._router = router;
    this._custom = custom || this._asyncWrap;
    this._queued = [];

    const getWireUpFunction: (method: HttpMethod) => WireUpFunction = ((method: HttpMethod) => {
      return (path: string, mdlwr?: WrappedHandler | WrappedHandler[], fn?: WrappedHandler) =>
        this._queue(method, path, mdlwr, fn);
    }).bind(this);

    this.get = getWireUpFunction('get');
    this.post = getWireUpFunction('post');
    this.put = getWireUpFunction('put');
    this.delete = getWireUpFunction('delete');
    this.patch = getWireUpFunction('patch');
    this.all = getWireUpFunction('all');
    this.options = getWireUpFunction('options');
    this.head = getWireUpFunction('head');
  }

  /*

    Takes an instance of a routes file class.
    Calls the express router methods and wraps the callbacks.

  */
  wrapRoutes(routes: T, parentPath: string, injectables: Injectables = {}): void {
    const wrap: CustomWrapper = this._custom || this._asyncWrap;

    for (const route of this._queued) {
      const { type: method, path, mdlwr, fn } = route;

      if (!path) {
        throw new Error('Missing route path in definition');
      }

      if (!fn || !fn.name) {
        throw new Error(`Missing named function for route: ${`${parentPath}${path}`.replace(/\/\//g, '/')}`);
      }

      // provide route info to the wrapper
      const routeInfo: RouteInformation = {
        method,
        fullPath: `${parentPath}${path}`.replace(/\/\//g, '/'),
        basePath: parentPath,
        subPath: path,
        routeClass: (routes as any).constructor.name,
        handler: fn.name,
      };

      this._router[method](path, mdlwr, wrap(fn.bind(routes), routeInfo, injectables));
    }
  }

  /*

    Provides a wrapped function that calls next on errors and sends the
    awaited return value of the wrapped function if no errors occur.

  */
  _asyncWrap(fn: WrappedHandler, routeInfo: RouteInformation): Handler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        (req as any).routeInfo = routeInfo;
        const results = await fn(req, res, next);
        if (results) {
          res.send(results);
        }
      } catch (err) {
        next(err);
      }
    };
  }

  /*

    Adds a route to the to-be-wrapped queue.

  */
  _queue(type: string, path: string, mdlwr?: WrappedHandler | WrappedHandler[], fn?: WrappedHandler): void {
    if (!fn && !Array.isArray(mdlwr)) {
      fn = mdlwr;
      mdlwr = [] as WrappedHandler[];
    }

    if (!fn) {
      throw new Error(`Missing handler for ${type.toUpperCase()}: ${path}`);
    }

    this._queued.push({ type, mdlwr, path, fn } as QueuedRouteHandler);
  }
}

export default Wrapper;
