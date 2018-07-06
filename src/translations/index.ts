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
  et: () => import('./et'),
  ko: () => import('./ko'),
  // Project language doesn't need to load anything extra
  en: () => Promise.resolve({
    default: {
      data: [],
      messages: {},
    },
  }),
};

export function importTranslation(locale: Locale): Promise<Messages> {
  return translations[locale]()
  .then((m) => {
    // Automatically inject locale data into runtime
    addLocaleData(m.default.data);

    return m.default.messages;
  });
}
