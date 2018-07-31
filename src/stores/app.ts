import { action, autorun, observable, runInAction } from 'mobx';
import { importTranslation, Messages } from '../translations';
import { getUserLocales, Locale } from '../utils/i18n';
import * as lstore from 'store';

export default class AppStore {
  translations: { [L in Locale]?: Messages } = {};
  @observable translationError: Error | null = null;

  @observable locale: Locale;

  // TODO store async components here
  components = {};

  constructor() {
    // Load locale from local storage, trying to autodetect one if unset
    const fallbackLocale = 'en';
    let locale = lstore.get('locale');
    if (!locale) {
      locale = getUserLocales()[0] || fallbackLocale;
    }
    this.locale = locale;
    autorun(() => lstore.set('locale', this.locale));
  }

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
