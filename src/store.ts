import { action, observable, configure, runInAction } from 'mobx';
import { getUserLocales, Locale } from './utils/i18n';
import { RouterStore } from 'mobx-router';
import { importTranslation, Messages } from './translations';

// make sure only actions modify the store
configure({ enforceActions: true });

export default class Store {
  router = new RouterStore();

  translations: { [L in Locale]?: Messages } = {};
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
      const ret = await importTranslation(locale);
      // alter the store
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
