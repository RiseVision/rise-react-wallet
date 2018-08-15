import { configure } from 'mobx';
import { RouterStore } from 'mobx-router';
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
  }
}
