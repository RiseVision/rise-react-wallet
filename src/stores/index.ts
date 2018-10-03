import { RouterStore } from 'mobx-router-rise';
import AccountStore from './account';
import AddressBookStore from './addressBook';
import AppStore from './app';
import OnboardingStore from './onboarding';
import RootStore from './root';
import WalletStore from './wallet';

export type TConfig = {
  api_url: string;
  explorer_url: string;
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
  addressBookStore: AddressBookStore;
};

/**
 * Dynamic store for the currently selected account.
 * @param stores
 */
export function accountStore(stores: TStores) {
  return {
    accountStore: stores.walletStore.selectedAccount
  };
}
