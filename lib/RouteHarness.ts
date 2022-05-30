import express, { Handler } from 'express';
import Wrapper from './Wrapper';
import { defaultFactory, FactoryFunction, RouteClass, RouteClassParam } from './Factory';
import { CustomWrapper, HarnessDependency, Injectables, RouteHarnessOptions } from './Types';

interface QueuedRouteClass {
  className: string;
  data: Injectables;
}

export class RouteHarness {
  private _app: express.Application;
  private _injectables: Injectables;
  private _customWrap: CustomWrapper | undefined;
  private _factory: FactoryFunction;
  private _wrapQueue: QueuedRouteClass[];

  /*

    Takes the express() instance as first parameter and options as 2nd.
    Available options include 'factory' (function), 'inject' (object), and
    'customWrapper' (function)

  */
  constructor(app: express.Application, opts: RouteHarnessOptions = {}) {
    this._app = app;
    this._injectables = opts.inject || {};
    this._customWrap = opts.customWrapper;
    this._factory = opts.factory || defaultFactory;
    this._wrapQueue = [];

    // bind the routerFactory
    this._routerFactory = this._routerFactory.bind(this);
  }

  /*

    Allow setting of options at a later time

  */
  configure(opts: RouteHarnessOptions): void {
    this._injectables = opts.inject || this._injectables;
    this._customWrap = opts.customWrapper || this._customWrap;
    this._factory = opts.factory || this._factory;
  }

  /*

    Allow using the routerHarness as a dependency

    Note: once you have it in a route class, you can use it via

    const r = router.getRouterForClass(this.constructor.name);
    r.get('/some-route/, this.someRouteMethod);

    // ...or getting the injected dependencies

    const deps = router.getDeps(this.constructor.name);

  */
  asDependency(): HarnessDependency {
    return this._routerFactory(this._injectables);
  }

  /*

    Create a router object to define subroutes with
    that has an expressRouter and wrapper tied to it

  */
  _routerFactory(injectables: Injectables) {
    const router = express.Router();
    const wrapper = new Wrapper(router, this._customWrap);

    const harnessRouter: Partial<HarnessDependency> = {};

    harnessRouter.getRouterForClass = (className: string): HarnessDependency => {
      const entry = this._wrapQueue.find((e) => e.className === className);
      if (!entry) {
        throw new Error(`Can't find router for class: ${className}`);
      }
      return entry.data['router'] as HarnessDependency;
    };

    harnessRouter.getDeps = (className): Injectables => {
      if (!this._wrapQueue || !this._wrapQueue.length) {
        throw new Error('Problem fetching dependencies, no routes found');
      }
      if (!className) {
        throw new Error("Can't fetch dependencies. Missing ClassName Param!");
      }
      const entry = this._wrapQueue.find((e) => e.className === className);
      if (!entry) {
        throw new Error('Problem fetching dependencies');
      }
      return entry.data;
    };

    harnessRouter.get = wrapper.get;
    harnessRouter.post = wrapper.post;
    harnessRouter.put = wrapper.put;
    harnessRouter.delete = wrapper.delete;
    harnessRouter.patch = wrapper.patch;
    harnessRouter.all = wrapper.all;
    harnessRouter.options = wrapper.options;
    harnessRouter.head = wrapper.head;

    // map the routes base path and sub paths
    harnessRouter._useInstance = <T>(parentPath: string, middleWare: Handler[] | T, routeClassInstance?: T) => {
      if (!routeClassInstance && !Array.isArray(middleWare)) {
        routeClassInstance = middleWare as T;
        middleWare = [];
      }
      wrapper.wrapRoutes(routeClassInstance, parentPath, injectables);
      this._app.use(parentPath, middleWare as Handler[], router);
    };

    harnessRouter._useInstance = harnessRouter._useInstance.bind(this);
    harnessRouter.getRouterForClass = harnessRouter.getRouterForClass?.bind(this)!;
    harnessRouter.getDeps = harnessRouter.getDeps?.bind(this)!;
    harnessRouter.configure = this.configure.bind(this);
    harnessRouter.use = this.use.bind(this);

    return harnessRouter as HarnessDependency;
  }

  /*

    Assigns routes by initializing the RouteClass and
    mapping the base path / base middleware to defined
    subroutes / subroute middleware

  */
  async use<T>(path: string, mdlwrOrClass: Handler[] | RouteClass<T>, SomeClass?: RouteClass<T>) {
    if (!SomeClass && !Array.isArray(mdlwrOrClass)) {
      SomeClass = mdlwrOrClass as RouteClass<T>;
      mdlwrOrClass = [];
    }

    if (!SomeClass) {
      throw new Error(`Missing class param for route '${path}'`);
    }

    let injectables = {};
    if (typeof this._injectables === 'object') {
      injectables = this._injectables;
    }

    // add the router for defining sub-routes within the constructor
    const router: HarnessDependency = this._routerFactory(injectables);
    const params: Injectables = Object.assign({}, { router }, injectables);

    try {
      // allow fetching routers and deps in class constructors
      const queueEntry = { className: SomeClass.name, data: params };
      this._wrapQueue.push(queueEntry);

      // initialize the route class instance via provided or default factory
      const routesInstance = await this._factory(SomeClass, params as RouteClassParam<T>);

      // after sub-routes are defined, map the base path and middleware
      params['router']._useInstance(path, mdlwrOrClass, routesInstance);
    } catch (e) {
      console.error(`Problem creating routes ${path} (${SomeClass.name})`, e);
    }
  }
}

export default RouteHarness;
