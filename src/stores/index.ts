import { RouterStore } from 'mobx-router';
import AccountStore from './account';
import AppStore from './app';
import OnboardingStore from './onboarding';
import RootStore from './root';
import WalletStore from './wallet';

export type TConfig = {
  api_url: string;
  date_format: string;
  date_format_short: string;
  fiat_currencies: string[];
};

export type TStores = {
  store: RootStore;
  appStore: AppStore;
  onboardingStore: OnboardingStore;
  walletStore: WalletStore;
  routerStore: RouterStore;
  accountStore?: AccountStore;
};

export function accountStore(stores: TStores) {
  return {
    accountStore: stores.walletStore.selectedAccount
  };
}
