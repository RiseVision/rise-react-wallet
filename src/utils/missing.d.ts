/* tslint:disable */
declare module 'mobx-router-rise' {
  import React from 'react';
  export type RouteParams = {
    [name: string]: string;
  };
  export type TRouteDef<GStore> = {
    path: string;
    component?: React.ReactElement<any>;
    onEnter?(
      route: Route<GStore>,
      params: RouteParams,
      store: GStore,
      queryParams: RouteParams
    ): void;

    onParamsChange?(
      route: Route<GStore>,
      params: RouteParams,
      store: GStore
    ): void;
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

declare module 'store/src/store-engine' {
  export const createStore: any;
}

declare module 'moment/min/moment-with-locales' {
  import moment from 'moment';
  export = moment;
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

/**
 * The BeforeInstallPromptEvent is fired at the Window.onbeforeinstallprompt handler
 * before a user is prompted to "install" a web site to a home screen on mobile.
 *
 * @deprecated Only supported on Chrome and Android Webview.
 */
interface BeforeInstallPromptEvent extends Event {
  /**
   * Returns an array of DOMString items containing the platforms on which the event was dispatched.
   * This is provided for user agents that want to present a choice of versions to the user such as,
   * for example, "web" or "play" which would allow the user to chose between a web version or
   * an Android version.
   */
  readonly platforms: Array<string>;

  /**
   * Returns a Promise that resolves to a DOMString containing either "accepted" or "dismissed".
   */
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;

  /**
   * Allows a developer to show the install prompt at a time of their own choosing.
   * This method returns a Promise.
   */
  prompt(): Promise<void>;
}
