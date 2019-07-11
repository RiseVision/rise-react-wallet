import { configure, observable } from 'mobx';
import AccountStore from './account';
import AddressBookStore from './addressBook';
import { TConfig } from './index';
import LangStore from './lang';
import LedgerStore from './ledger';
import OnboardingStore from './onboarding';
import RouterStore from './router';
import WalletStore from './wallet';

// make sure only actions modify the store
configure({ enforceActions: 'observed' });

export default class RootStore {
  router = new RouterStore(this);
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
  }
}
