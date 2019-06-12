import AccountStore from './account';
import AddressBookStore from './addressBook';
import LangStore from './lang';
import OnboardingStore from './onboarding';
import RootStore from './root';
import RouterStore from './router';
import WalletStore from './wallet';
import LedgerStore from './ledger';

export type TConfig = {
  api_url: string;
  api_url_testnet: string;
  domain: string;
  explorer_url: string;
  date_format: string;
  fiat_currencies: string[];
  max_drawer_accounts: number;
  // seconds
  suggested_delegates_cache_sec: number;
};

export type TStores = {
  store: RootStore;
  langStore: LangStore;
  onboardingStore: OnboardingStore;
  walletStore: WalletStore;
  routerStore: RouterStore;
  accountStore?: AccountStore;
  addressBookStore: AddressBookStore;
  ledgerStore: LedgerStore;
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
