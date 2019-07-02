import { action, autorun, observable, runInAction } from 'mobx';
import { addLocaleData, Locale as LocaleData } from 'react-intl';
import lstore from '../utils/store';
import { getUserLocales, Locale } from '../utils/i18n';

interface MessageDescriptor {
  id: string;
  description?: string;
  defaultMessage?: string;
}

export default class LangStore {
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

  async importTranslation(locale: Locale): Promise<Messages> {
    // tslint:disable-next-line:no-use-before-declare
    let data = await translations[locale]();
    // Automatically inject locale data into runtime
    addLocaleData(data.default.data);

    return data.default.messages;
  }

  @action
  async loadTranslation(locale: Locale) {
    this.translationError = null;
    if (this.translations.get(locale)) {
      return;
    }

    try {
      const ret = await this.importTranslation(locale);
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

export interface Messages {
  [id: string]: string;
}

interface Translation {
  data: LocaleData | LocaleData[];
  messages: Messages;
}

interface TranslationModule {
  default: Translation;
}

const translations: { [P in Locale]: () => Promise<TranslationModule> } = {
  // de: () => import('../translations/de'),
  // es: () => import('../translations/es'),
  et: () => import('../translations/et'),
  fr: () => import('../translations/fr'),
  // it: () => import('../translations/it'),
  // hu: () => import('../translations/hu'),
  nl: () => import('../translations/nl'),
  pl: () => import('../translations/pl'),
  // ro: () => import('../translations/ro'),
  // ru: () => import('../translations/ru'),
  // uk: () => import('../translations/uk'),
  // zh: () => import('../translations/zh'),
  // Project language doesn't need to load anything extra
  en: async () => ({
    default: {
      data: [],
      messages: {}
    }
  })
};
