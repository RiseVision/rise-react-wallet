import { configure } from 'mobx';
import { RouterStore, Route, RouteParams } from 'mobx-router-rise';
import AccountStore from './account';
import AddressBookStore from './addressBook';
import AppStore from './app';
import { TConfig } from './index';
import OnboardingStore from './onboarding';
import WalletStore from './wallet';

// make sure only actions modify the store
configure({ enforceActions: true });

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

export default class RootStore {
  router = new RouterStore();
  app = new AppStore();
  onboarding: OnboardingStore;
  wallet: WalletStore;
  account: AccountStore;
  addressBook: AddressBookStore;

  constructor(public config: TConfig) {
    this.addressBook = new AddressBookStore();
    this.onboarding = new OnboardingStore();
    this.wallet = new WalletStore(
      config,
      this.router,
      this.addressBook,
      this.app
    );
    const self = this;
    const oldGoTo = this.router.goTo;
    this.router.goTo = function(
      route: Route<RootStore>,
      params?: RouteParams,
      store?: RootStore,
      queryParams?: RouteParams
    ) {
      // use the RootStore as a default store when changing routes
      // TODO create an issue for mobx-router-rise
      return oldGoTo.call(this, route, params, store || self, queryParams);
    };
  }

  navigateTo(dest: RouteLink) {
    const { route, onBeforeNavigate, onAfterNavigate } = dest;
    const params = dest.params || {};
    const queryParams = dest.queryParams || {};

    if (onBeforeNavigate) {
      onBeforeNavigate(route, params, queryParams);
    }
    this.router.goTo(route, params, this, queryParams);
    if (onAfterNavigate) {
      onAfterNavigate(route, params, queryParams);
    }
  }

  linkUrl(dest: RouteLink) {
    const { route, params, queryParams } = dest;
    return route.replaceUrlParams(params || {}, queryParams || {});
  }
}
