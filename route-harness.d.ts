export declare type RouteClassParam<T> = T extends new (args: infer P) => T ? P : never;
export declare type RouteClass<T> = new (args: RouteClassParam<T>) => T;
export declare type FactoryFunction = <T>(C: RouteClass<T>, args: RouteClassParam<T>) => T;
export declare type LooseFactory = (C: RouteClass<any>, args: RouteClassParam<any>) => any;
export interface IFactory<T> {
    createInstance(args?: RouteClassParam<T>): T;
}
export declare class Factory<T> implements IFactory<T> {
    protected FactoryType: RouteClass<T>;
    constructor(FactoryType: RouteClass<T>);
    createInstance(args: RouteClassParam<T>): T;
}
export declare const defaultFactory: FactoryFunction;
import express, { Handler } from 'express';
import { RouteClass } from './Factory';
import { HarnessDependency, Injectables, RouteHarnessOptions } from './Types';
export declare class RouteHarness {
    private _app;
    private _injectables;
    private _customWrap;
    private _factory;
    private _wrapQueue;
    constructor(app: express.Application, opts?: RouteHarnessOptions);
    configure(opts: RouteHarnessOptions): void;
    asDependency(): HarnessDependency;
    _routerFactory(injectables: Injectables): HarnessDependency;
    use<T>(path: string, mdlwrOrClass: Handler[] | RouteClass<T>, SomeClass?: RouteClass<T>): Promise<void>;
}
export default RouteHarness;
import { Handler, Request, Response, NextFunction } from 'express';
import { FactoryFunction, RouteClass } from './Factory';
export declare type WrappedHandler = (req: Request, res: Response, next?: NextFunction) => any;
export declare type WireUpFunction = (path: string, mdlwr?: WrappedHandler | WrappedHandler[], fn?: WrappedHandler) => void;
export interface RouteInformation {
    method: string;
    routeClass: string;
    fullPath: string;
    subPath: string;
    basePath: string;
    handler: string;
}
export declare type CustomWrapper = (handler: WrappedHandler, info: RouteInformation, injectedProps: Injectables) => Handler;
export declare type Injectables = {
    [k: string]: any;
};
export interface RouteHarnessOptions {
    inject?: Injectables;
    factory?: FactoryFunction;
    customWrapper?: CustomWrapper;
}
export interface HarnessDependency {
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
    use: <T>(path: string, mdlwrOrClass: Handler[] | RouteClass<T>, SomeClass?: RouteClass<T>) => Promise<void>;
    configure: (opts: RouteHarnessOptions) => void;
    _useInstance: (parentPath: string, middleWare?: any[], routeClassInstance?: any) => void;
}


import { Handler, Router } from 'express';
import { CustomWrapper, Injectables, RouteInformation, WrappedHandler, WireUpFunction } from './Types';
export declare class Wrapper<T> {
    private _router;
    private _custom;
    private _queued;
    get: WireUpFunction;
    post: WireUpFunction;
    put: WireUpFunction;
    delete: WireUpFunction;
    patch: WireUpFunction;
    all: WireUpFunction;
    options: WireUpFunction;
    head: WireUpFunction;
    constructor(router: Router, custom?: CustomWrapper);
    wrapRoutes(routes: T, parentPath: string, injectables?: Injectables): void;
    _asyncWrap(fn: WrappedHandler, routeInfo: RouteInformation): Handler;
    _queue(type: string, path: string, mdlwr?: WrappedHandler | WrappedHandler[], fn?: WrappedHandler): void;
}
