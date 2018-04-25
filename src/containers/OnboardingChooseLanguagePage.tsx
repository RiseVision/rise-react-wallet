import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List';
import LanguageIcon from '@material-ui/icons/Language';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';

// Labels are hard-coded here as we want to load the actual localization data
// after the user has selected the language, not before.
let availableLanguages = [{
  locale: 'de',
  label: 'Weiter auf Deutsch',
}, {
  locale: 'en',
  label: 'Continue in English',
}, {
  locale: 'es',
  label: 'Continuar en español',
}, {
  locale: 'et',
  label: 'Jätka eesti keeles',
}, {
  locale: 'fr',
  label: 'Continuer en français',
}, {
  locale: 'hu',
  label: 'Folytatás magyarul',
}, {
  locale: 'nl',
  label: 'Ga door in het Nederlands',
}, {
  locale: 'pl',
  label: 'Kontynuuj po polsku',
}, {
  locale: 'ro',
  label: 'Continuați în română',
}, {
  locale: 'ru',
  label: 'Продолжить на русском',
}, {
  locale: 'uk',
  label: 'Продовжуйте по-українськи',
}, {
  locale: 'zh',
  label: '繼續用中文',
}];

class OnboardingChooseLanguagePage extends React.Component {
  render() {
    // Order languages by browser preference
    let userLanguages = navigator.languages
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
            <ListItem key={lang.locale} button={true}>
              <ListItemIcon>
                <LanguageIcon />
              </ListItemIcon>
              <ListItemText>{lang.label}</ListItemText>
              <KeyboardArrowRight />
            </ListItem>
          ))}
        </List>
      </ModalPaper>
    );
  }
}

export default OnboardingChooseLanguagePage;
