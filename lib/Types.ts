import { Handler, Request, Response, NextFunction } from 'express';
import { FactoryFunction, RouteClass } from './Factory';

/*

  Types for defining your routes and handlers.

*/
export type WrappedHandler = (req: Request, res: Response, next?: NextFunction) => any;
export type WireUpFunction = (path: string, mdlwr?: WrappedHandler | WrappedHandler[], fn?: WrappedHandler) => void;

/*

  Information passed to the CustomWrapper option if provided.

*/
export interface RouteInformation {
  method: string;
  routeClass: string;
  fullPath: string;
  subPath: string;
  basePath: string;
  handler: string;
}

/*

  Custom option types.

*/
export type CustomWrapper = (handler: WrappedHandler, info: RouteInformation, injectedProps: Injectables) => Handler;
export type Injectables = { [k: string]: any };

/*

  Possible options passed to the RouteHarness constructor

*/
export interface RouteHarnessOptions {
  inject?: Injectables;
  factory?: FactoryFunction;
  customWrapper?: CustomWrapper;
}

/*

  Get the RouteHaress in dependency form for use as a single resource to pass or inject manually into route classes.

*/
export interface HarnessDependency {
  // for use in route class
  getRouterForClass: (className: string) => HarnessDependency;
  getDeps: (className: string) => Injectables;
  get: WireUpFunction;
  post: WireUpFunction;
  put: WireUpFunction;
  delete: WireUpFunction;
  patch: WireUpFunction;
  all: WireUpFunction;
  options: WireUpFunction;
  head: WireUpFunction;

  // for use outside route class
  use: <T>(path: string, mdlwrOrClass: Handler[] | RouteClass<T>, SomeClass?: RouteClass<T>) => Promise<void>;
  configure: (opts: RouteHarnessOptions) => void;

  // internal
  _useInstance: (parentPath: string, middleWare?: any[], routeClassInstance?: any) => void;
}
