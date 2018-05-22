import { addLocaleData, Locale as LocaleData } from 'react-intl';
import { Locale } from '../utils/i18n';

interface Messages {
  [id: string]: string;
}

interface Translation {
  data: LocaleData | LocaleData[];
  messages: Messages;
}

interface TranslationModule {
  default: Translation;
}

const translations: {
  [P in Locale]: () => Promise<TranslationModule>;
} = {
  de: () => import('./de'),
  en: () => import('./en'),
  es: () => import('./es'),
  et: () => import('./et'),
  fr: () => import('./fr'),
  hu: () => import('./hu'),
  nl: () => import('./nl'),
  pl: () => import('./pl'),
  ro: () => import('./ro'),
  ru: () => import('./ru'),
  uk: () => import('./uk'),
  zh: () => import('./zh'),
};

export function importTranslation(locale: Locale): Promise<Messages> {
  return translations[locale]()
  .then((m) => {
    // Automatically inject locale data into runtime
    addLocaleData(m.default.data);

    return m.default.messages;
  });
}
