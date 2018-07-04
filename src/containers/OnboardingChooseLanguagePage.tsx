import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';
import FlagIcon from '../components/FlagIcon';
import Store from '../store';
import {
  Locale,
  Locales,
  getUserLocales,
  getMainCountryForLocale
} from '../utils/i18n';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import { onboardingAddAccountRoute } from '../routes';

const riseIcon = require('../images/rise_icon.svg');

// Labels are hard-coded here as we want to load the actual localization data
// after the user has selected the language, not before.
const localeLabels: {
  [P in Locale]: string;
} = {
  de: 'Weiter auf Deutsch',
  en: 'Continue in English',
  es: 'Continuar en español',
  et: 'Jätka eesti keeles',
  fr: 'Continuer en français',
  it: 'Continua in italiano',
  hu: 'Folytatás magyarul',
  nl: 'Ga door in het Nederlands',
  pl: 'Kontynuuj po polsku',
  ro: 'Continuați în română',
  ru: 'Продолжить на русском',
  uk: 'Продовжуйте по-українськи',
  zh: '繼續用中文',
};

const styles = createStyles({
  titleIcon: {
    margin: '-4px 4px',
  },
});

interface Props extends WithStyles<typeof styles> {
  store?: Store;
}

const stylesDecorator = withStyles(styles, { name: 'OnboardingChooseLanguagePage' });

@inject('store')
@observer
class OnboardingChooseLanguagePage extends React.Component<Props> {
  handleLanguageClicked = async (locale: Locale) => {
    await this.props.store.changeLanguage(locale);
    this.props.store.router.goTo(onboardingAddAccountRoute);
  }

  render() {
    // Order languages by browser preference
    const userLanguages = getUserLocales();
    let languages = Locales.map((locale) => {
      return {
        locale: locale,
        countryCode: getMainCountryForLocale(locale),
        label: localeLabels[locale],
      };
    });
    languages.sort((a, b) => {
      let aIdx = userLanguages.indexOf(a.locale);
      let bIdx = userLanguages.indexOf(b.locale);

      if (aIdx < 0) { aIdx = userLanguages.length; }
      if (bIdx < 0) { bIdx = userLanguages.length; }
      return aIdx - bIdx;
    });

    const { classes } = this.props;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader>
          <FormattedMessage
            id="onboarding-choose-language.title"
            description="Choose language screen title"
            defaultMessage="{icon} RISE wallet"
            values={{
              icon: (
                <img
                  className={classes.titleIcon}
                  src={riseIcon}
                  height={24}
                  alt=""
                />
              ),
            }}
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

// TODO make it a decorator
export default stylesDecorator(OnboardingChooseLanguagePage);
