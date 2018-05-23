const manageTranslations = require('react-intl-translations-manager').default;

manageTranslations({
    messagesDirectory: 'src/translations/extracted/',
    translationsDirectory: 'src/translations/locales/',
    languages: ['de', 'es', 'et', 'fr', 'it', 'hu', 'nl', 'pl', 'ro', 'ru', 'uk', 'zh', 'zh'],
});
