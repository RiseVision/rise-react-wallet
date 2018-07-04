declare module 'mobx-router' {
  import * as React from 'react';
  export type TRouteDef<S> = {
    path: string;
    component?: React.ReactElement<any>;
    onEnter?: (route: Route<S>, params: {}, store: S, queryParams: {}) => void;
  };
  export class Route<S> {
    constructor(routeDef: TRouteDef<S>);
  }
  export class RouterStore {
    goTo(route: Route<any>): void;
  }
  export class MobxRouter extends React.Component {}
  export function startRouter(
    routes: { [route: string]: Route<any> },
    store: Object
  ): void;
}
