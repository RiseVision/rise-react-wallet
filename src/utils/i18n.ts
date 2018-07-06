export type Locale =
  | 'en'
  | 'et'
  | 'ko';

export type CountryCode =
  | 'gb'
  | 'ee'
  | 'kr';

const localeInfo: {
  [P in Locale]: {
    mainCountry: CountryCode;
  };
} = {
  en: { mainCountry: 'gb' },
  et: { mainCountry: 'ee' },
  ko: { mainCountry: 'kr' },
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
