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
  date_format: string;
  fiat_currencies: string[];
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
}

// magic...
const epoch = Date.UTC(2016, 4, 24, 17, 0, 0, 0) / 1000;
export function correctTimestamp(timestamp: number) {
  return new Date((timestamp + epoch) * 1000).getTime();
}

export function normalizeAddress(address: string): string {
  const normalizedAddress = address.toUpperCase();
  if (!normalizedAddress.match(/^\d{1,20}R$/)) {
    return '';
  } else {
    return normalizedAddress;
  }
}
