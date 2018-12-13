import { observable, runInAction } from 'mobx';
import { Locale as LocaleData, FormattedMessage } from 'react-intl';
import MessageDescriptor = FormattedMessage.MessageDescriptor;
import et from './translations/et';

function getUserLocales(): Locale[] {
  return [];
}

function getStoredLocales(): Locale | null {
  return null;
}

// TODO keep in sync with /src/utils/i18n.ts
export type Locale = 'en' | 'et';

export default class LangStore {
  // TODO keep in sync with /src/stores/lang.ts
  translations: { [P in Locale]: Translation } = {
    et,
    // Project language doesn't need to load anything extra
    en: {
      data: [],
      messages: {}
    }
  };
  translationError: Error | null = null;
  @observable locale: Locale;

  constructor() {
    // Load locale from local storage, trying to autodetect one if unset
    const fallbackLocale = 'en';
    let locale = getStoredLocales();
    if (!locale) {
      locale = getUserLocales()[0] || fallbackLocale;
    }
    runInAction(() => {
      this.locale = locale;
    });
  }

  async changeLanguage(locale: Locale) {
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
    const fallbackEN = this.translations['en'].messages[id];
    const messages = this.translations[this.locale];
    return (messages && messages[id]) || fallback || fallbackEN || id;
  }
}

export interface Messages {
  [id: string]: string;
}

interface Translation {
  data: LocaleData | LocaleData[];
  messages: Messages;
}
