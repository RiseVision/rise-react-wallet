export type Locale =
  | 'en'
  | 'de'
  | 'es'
  | 'et'
  | 'fr'
  | 'it'
  | 'hu'
  | 'nl'
  | 'pl'
  | 'ro'
  | 'ru'
  | 'uk'
  | 'zh';

export type CountryCode =
  | 'de'
  | 'gb'
  | 'es'
  | 'ee'
  | 'fr'
  | 'it'
  | 'hu'
  | 'nl'
  | 'pl'
  | 'ro'
  | 'ru'
  | 'ua'
  | 'cn';

const localeInfo: {
  [P in Locale]: {
    mainCountry: CountryCode;
  };
} = {
  en: { mainCountry: 'gb' },
  de: { mainCountry: 'de' },
  es: { mainCountry: 'es' },
  et: { mainCountry: 'ee' },
  fr: { mainCountry: 'fr' },
  it: { mainCountry: 'it' },
  hu: { mainCountry: 'hu' },
  nl: { mainCountry: 'nl' },
  pl: { mainCountry: 'pl' },
  ro: { mainCountry: 'ro' },
  ru: { mainCountry: 'ru' },
  uk: { mainCountry: 'ua' },
  zh: { mainCountry: 'cn' },
};

export const Locales: Locale[] = Object.keys(localeInfo) as Locale[];

export function getMainCountryForLocale(locale: Locale): CountryCode {
  return localeInfo[locale].mainCountry;
}

export function getUserLocales(): Locale[] {
  return navigator.languages
    .map(locale => locale.split('-')[0] as Locale)
    .filter(locale => locale in localeInfo);
}
