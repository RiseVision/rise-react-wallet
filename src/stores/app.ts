import { action, autorun, observable, runInAction } from 'mobx';
import * as lstore from 'store';
import { importTranslation, Messages } from '../translations';
import { getUserLocales, Locale } from '../utils/i18n';
import MessageDescriptor = ReactIntl.FormattedMessage.MessageDescriptor;

// TODO rename to TranslationsStore
export default class AppStore {
  @observable translations = observable.map<Locale, Messages>();
  @observable translationError: Error | null = null;
  @observable locale: Locale;

  constructor() {
    // Load locale from local storage, trying to autodetect one if unset
    const fallbackLocale = 'en';
    let locale = lstore.get('locale');
    if (!locale) {
      locale = getUserLocales()[0] || fallbackLocale;
    }
    this.loadTranslation(locale);
    this.locale = locale;
    autorun(() => lstore.set('locale', this.locale));
  }

  @action
  async loadTranslation(locale: Locale) {
    this.translationError = null;
    if (this.translations.get(locale)) {
      return;
    }

    try {
      const ret = await importTranslation(locale);
      runInAction(() => {
        this.translations.set(locale, ret);
      });
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

  /**
   * Get a translation entry in the current locale.
   * TODO support formatMessage
   */
  get(msg: MessageDescriptor): string {
    const id = msg.id;
    const fallback = msg.defaultMessage;
    const messages = this.translations.get(this.locale);
    return (messages && messages[id]) || fallback || id;
  }
}
