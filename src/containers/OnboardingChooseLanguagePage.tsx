import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';
import FlagIcon, { CountryCode } from '../components/FlagIcon';

// Labels are hard-coded here as we want to load the actual localization data
// after the user has selected the language, not before.
const availableLanguages: {
  locale: string;
  countryCode: CountryCode;
  label: string;
}[] = [{
  locale: 'de',
  countryCode: 'de',
  label: 'Weiter auf Deutsch',
}, {
  locale: 'en',
  countryCode: 'gb',
  label: 'Continue in English',
}, {
  locale: 'es',
  countryCode: 'es',
  label: 'Continuar en español',
}, {
  locale: 'et',
  countryCode: 'ee',
  label: 'Jätka eesti keeles',
}, {
  locale: 'fr',
  countryCode: 'fr',
  label: 'Continuer en français',
}, {
  locale: 'hu',
  countryCode: 'hu',
  label: 'Folytatás magyarul',
}, {
  locale: 'nl',
  countryCode: 'nl',
  label: 'Ga door in het Nederlands',
}, {
  locale: 'pl',
  countryCode: 'pl',
  label: 'Kontynuuj po polsku',
}, {
  locale: 'ro',
  countryCode: 'ro',
  label: 'Continuați în română',
}, {
  locale: 'ru',
  countryCode: 'ru',
  label: 'Продолжить на русском',
}, {
  locale: 'uk',
  countryCode: 'ua',
  label: 'Продовжуйте по-українськи',
}, {
  locale: 'zh',
  countryCode: 'cn',
  label: '繼續用中文',
}];

interface Props {
  onLanguageSelected: (locale: string) => void;
}

class OnboardingChooseLanguagePage extends React.Component<Props> {
  handleLanguageClicked = (locale: string) => {
    this.props.onLanguageSelected(locale);
  }

  render() {
    // Order languages by browser preference
    const userLanguages = navigator.languages
      .map(locale => locale.split('-')[0]);
    let languages = availableLanguages.slice();
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
