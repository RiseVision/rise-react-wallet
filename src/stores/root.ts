import { configure } from 'mobx';
import { RouterStore, Route } from 'mobx-router';
import AccountStore from './account';
import AppStore from './app';
import { TConfig } from './index';
import OnboardingStore from './onboarding';
import WalletStore from './wallet';

// make sure only actions modify the store
configure({ enforceActions: true });

export default class RootStore {
  router = new RouterStore();
  app = new AppStore();
  onboarding: OnboardingStore;
  wallet: WalletStore;
  account: AccountStore;

  constructor(public config: TConfig) {
    this.onboarding = new OnboardingStore();
    this.wallet = new WalletStore(config, this.router);
    const old = this.router.goTo;
    const self = this;
    this.router.goTo = function(
      route: Route<any>,
      params?: object,
      store?: any,
      queryParamsObj?: object
    ) {
      // use the RootStore as a default store when changing routes
      // TODO create an issue for mobx-router
      return old.call(this, route, params, store || self, queryParamsObj);
    };
  }
}
