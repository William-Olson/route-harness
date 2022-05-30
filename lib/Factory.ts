export type RouteClassParam<T> = T extends new (args: infer P) => T ? P : never;
export type RouteClass<T> = new (args: RouteClassParam<T>) => T;

export type FactoryFunction = <T>(C: RouteClass<T>, args: RouteClassParam<T>) => T;
export type LooseFactory = (C: RouteClass<any>, args: RouteClassParam<any>) => any;

export interface IFactory<T> {
  createInstance(args: RouteClassParam<T>): T;
}

export class Factory<T> implements IFactory<T> {
  protected FactoryType: RouteClass<T>;

  // must pass the type to create in constructor
  constructor(FactoryType: RouteClass<T>) {
    this.FactoryType = FactoryType;
  }

  // this can be overridden
  public createInstance(args: RouteClassParam<T>): T {
    const instance: T = new this.FactoryType(args);

    // can modify instance

    return instance;
  }
}

export const defaultFactory: FactoryFunction = <T>(
  C: RouteClass<T>,
  args: RouteClassParam<T>,
): T => {
  const factory: IFactory<T> = new Factory(C);
  return factory.createInstance(args);
};
