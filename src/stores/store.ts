import { LiskWallet } from 'dpos-offline';
import { action, observable, configure, runInAction } from 'mobx';
import { getUserLocales, Locale } from '../utils/i18n';
import { RouterStore } from 'mobx-router';
import { importTranslation, Messages } from '../translations';
import UserStore from './user';

// make sure only actions modify the store
configure({ enforceActions: true });

export type TConfig = {
  api_url: string;
};

export default class Store {
  router = new RouterStore();

  translations: { [L in Locale]?: Messages } = {};
  @observable translationError: Error | null = null;
  // address used during onboarding
  @observable address: string | null = null;
  @observable mnemonic: string[] | null = null;

  // TODO: Attempt to restore locale from a cookie/local storage.
  @observable locale = getUserLocales()[0] || 'en';

  // TODO store async components here
  components = {};

  userStore: UserStore | null;

  constructor(public config: TConfig) {}

  @action
  async loadTranslation(locale: Locale) {
    this.translationError = null;
    if (this.translations[locale]) {
      return;
    }

    try {
      const ret = await importTranslation(locale);
      this.translations[locale] = ret;
    } catch (err) {
      // alter the store
      runInAction(() => {
        this.translationError = err;
      });
    }
  }

  @action
  async changeLanguage(locale: Locale) {
    await this.loadTranslation(locale);
    // alter the store
    runInAction(() => {
      this.locale = locale;
    });
  }

  @action
  onAccountCreated(mnemonic: string[]) {
    this.mnemonic = mnemonic;
    const wallet = new LiskWallet(mnemonic.join(' '), 'R');
    this.address = wallet.address;
  }
}
