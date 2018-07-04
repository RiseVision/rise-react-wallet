import { action, observable } from 'mobx';
import { getUserLocales, Locale } from './utils/i18n';
import { RouterStore } from 'mobx-router';
import { importTranslation, Messages } from './translations';

export default class Store {
  router = new RouterStore();

  @observable translations: { [L in Locale]?: Messages } = {};
  @observable translationError: Error | null = null;

  // TODO: Attempt to restore locale from a cookie/local storage.
  @observable locale = getUserLocales()[0] || 'en';

  // TODO store async components here
  components = {};

  @action
  async loadTranslation(locale: Locale) {
    this.translationError = null;
    if (this.translations[locale]) {
      return;
    }

    try {
      this.translations[locale] = await importTranslation(locale);
    } catch (err) {
      this.translationError = err;
    }
  }

  @action
  async changeLanguage(locale: Locale) {
    await this.loadTranslation(locale);
    this.locale = locale;
  }
}
