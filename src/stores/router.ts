import { RouterStore as Base, Route, RouteParams } from 'mobx-router-rise';
import RootStore from './root';

export interface RouteLink {
  route: Route<{}>;
  params?: RouteParams;
  queryParams?: RouteParams;
  onBeforeNavigate?: (
    route: Route<{}>,
    params: RouteParams,
    queryParams: RouteParams
  ) => void;
  onAfterNavigate?: (
    route: Route<{}>,
    params: RouteParams,
    queryParams: RouteParams
  ) => void;
}

export default class RouterStore extends Base {
  constructor(public rootStore: RootStore) {
    super();
  }

  goTo(
    route: Route<RootStore>,
    params?: RouteParams,
    store?: RootStore | null,
    queryParams?: RouteParams
  ) {
    return super.goTo(route, params, store || this.rootStore, queryParams);
  }

  navigateTo(dest: RouteLink) {
    const { route, onBeforeNavigate, onAfterNavigate } = dest;
    const params = dest.params || {};
    const queryParams = dest.queryParams || {};

    if (onBeforeNavigate) {
      onBeforeNavigate(route, params, queryParams);
    }
    this.goTo(route, params, this.rootStore, queryParams);
    if (onAfterNavigate) {
      onAfterNavigate(route, params, queryParams);
    }
  }

  linkUrl(dest: RouteLink) {
    const { route, params, queryParams } = dest;
    return route.replaceUrlParams(params || {}, queryParams || {});
  }
}
