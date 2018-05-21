const localeInfo = {
  en: null,
  de: null,
  es: null,
  et: null,
  fr: null,
  hu: null,
  nl: null,
  pl: null,
  ro: null,
  ru: null,
  uk: null,
  zh: null,
};

export type Locale = keyof typeof localeInfo;
export const Locales: Locale[] = Object.keys(localeInfo) as Locale[];

export function getUserLocales(): Locale[] {
  return navigator.languages
    .map(locale => locale.split('-')[0] as Locale)
    .filter(locale => locale in localeInfo);
}
