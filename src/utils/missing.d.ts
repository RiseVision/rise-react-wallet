/* tslint:disable */
declare module 'mobx-router-rise' {
  import * as React from 'react';
  export type RouteParams = {
    [name: string]: string;
  };
  export type TRouteDef<GStore> = {
    path: string;
    component?: React.ReactElement<any>;
    onEnter?: (
      route: Route<GStore>,
      params: RouteParams,
      store: GStore,
      queryParams: RouteParams
    ) => void;
  };
  export class Route<S> {
    constructor(routeDef: TRouteDef<S>);
    component: React.ReactElement<any>;
    getParamsObject(paramsArray: string[]): RouteParams;
    getRootPath(): string;
    goTo(route: Route<any>): void;
    originalPath: string;
    path: string;
    replaceUrlParams(params: RouteParams, queryParams: RouteParams): string;
    rootPath: string;
  }
  export class RouterStore {
    goTo(
      route: Route<any>,
      params?: RouteParams,
      store?: any,
      queryParamsObj?: RouteParams
    ): void;
    currentView: Route<any>;
    queryParams: RouteParams;
    params: RouteParams;
  }
  export class MobxRouter extends React.Component {}
  export function startRouter(
    routes: { [route: string]: Route<any> },
    store: Object,
    options?: Object
  ): void;
}

declare module 'moment/min/moment-with-locales' {
  import * as moment from 'moment'
  export = moment
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
