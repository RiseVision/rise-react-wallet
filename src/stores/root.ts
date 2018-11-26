import { configure, observable } from 'mobx';
import { RouterStore, Route, RouteParams } from 'mobx-router-rise';
import AccountStore from './account';
import AddressBookStore from './addressBook';
import LangStore from './lang';
import { TConfig } from './index';
import OnboardingStore from './onboarding';
import WalletStore from './wallet';
import LedgerStore from './ledger';

// make sure only actions modify the store
configure({ enforceActions: 'observed' });

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
  lang = new LangStore();
  onboarding: OnboardingStore;
  wallet: WalletStore;
  account: AccountStore;
  addressBook: AddressBookStore;
  ledger = new LedgerStore();
  @observable updateAvailable: boolean = false;

  constructor(public config: TConfig) {
    this.addressBook = new AddressBookStore();
    this.onboarding = new OnboardingStore();
    this.wallet = new WalletStore(
      config,
      this.router,
      this.addressBook,
      this.lang
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

  /** TODO move to RouterStore */
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
