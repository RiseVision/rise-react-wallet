/* tslint:disable */
declare module 'mobx-router' {
  import * as React from 'react';
  export type TRouteDef<GStore> = {
    path: string;
    component?: React.ReactElement<any>;
    onEnter?: (
      route: Route<GStore>,
      params: {},
      store: GStore,
      queryParams: {}
    ) => void;
  };
  export class Route<S> {
    constructor(routeDef: TRouteDef<S>);
    component: React.ReactElement<any>;
    getParamsObject(): { [name: string]: string };
    getRootPath(): string;
    goTo(route: Route<any>): void;
    originalPath: string;
    path: string;
    replaceUrlParams(values: { [name: string]: string }): string;
    rootPath: string;
  }
  export class RouterStore {
    goTo(
      route: Route<any>,
      params?: object,
      store?: any,
      queryParamsObj?: object
    ): void;
    currentView: Route<any>;
    queryParams: Map<string, string>;
    params: Map<string, string>;
  }
  export class MobxRouter extends React.Component {}
  export function startRouter(
    routes: { [route: string]: Route<any> },
    store: Object
  ): void;
}

declare module '*.json' {
  const value: any;
  export default value;
}

declare module 'store' {
  const value: any;
  export = value;
}

declare module 'uniqueRandom' {
  const value: any;
  export = value;
}
