import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';
import FlagIcon, { CountryCode } from '../components/FlagIcon';
import { Locale, Locales, getUserLocales } from '../utils/i18n';

// Labels are hard-coded here as we want to load the actual localization data
// after the user has selected the language, not before.
const languagesChoices: {
  [P in Locale]: {
    countryCode: CountryCode;
    label: string;
  };
} = {
  de: {
    countryCode: 'de',
    label: 'Weiter auf Deutsch',
  },
  en: {
    countryCode: 'gb',
    label: 'Continue in English',
  },
  es: {
    countryCode: 'es',
    label: 'Continuar en español',
  },
  et: {
    countryCode: 'ee',
    label: 'Jätka eesti keeles',
  },
  fr: {
    countryCode: 'fr',
    label: 'Continuer en français',
  },
  hu: {
    countryCode: 'hu',
    label: 'Folytatás magyarul',
  },
  nl: {
    countryCode: 'nl',
    label: 'Ga door in het Nederlands',
  },
  pl: {
    countryCode: 'pl',
    label: 'Kontynuuj po polsku',
  },
  ro: {
    countryCode: 'ro',
    label: 'Continuați în română',
  },
  ru: {
    countryCode: 'ru',
    label: 'Продолжить на русском',
  },
  uk: {
    countryCode: 'ua',
    label: 'Продовжуйте по-українськи',
  },
  zh: {
    countryCode: 'cn',
    label: '繼續用中文',
  },
};

interface Props {
  onLanguageSelected: (locale: Locale) => void;
}

class OnboardingChooseLanguagePage extends React.Component<Props> {
  handleLanguageClicked = (locale: Locale) => {
    this.props.onLanguageSelected(locale);
  }

  render() {
    // Order languages by browser preference
    const userLanguages = getUserLocales();
    let languages = Locales.map((locale) => {
      return {
        locale: locale,
        ...languagesChoices[locale],
      };
    });
    languages.sort((a, b) => {
      let aIdx = userLanguages.indexOf(a.locale);
      let bIdx = userLanguages.indexOf(b.locale);

      if (aIdx < 0) { aIdx = userLanguages.length; }
      if (bIdx < 0) { bIdx = userLanguages.length; }
      return aIdx - bIdx;
    });

    return (
      <ModalPaper>
        <ModalPaperHeader>
          <FormattedMessage
            id="onboarding-choose-language.title"
            description="Choose language screen title"
            defaultMessage="RISE wallet"
          />
        </ModalPaperHeader>
        <List>
          {languages.map(lang => (
            <ListItem
              key={lang.locale}
              button={true}
              onClick={this.handleLanguageClicked.bind(this, lang.locale)}
            >
              <FlagIcon countryCode={lang.countryCode} />
              <ListItemText>{lang.label}</ListItemText>
              <ChevronRight />
            </ListItem>
          ))}
        </List>
      </ModalPaper>
    );
  }
}

export default OnboardingChooseLanguagePage;
