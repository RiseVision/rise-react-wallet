import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TranslateIcon from '@material-ui/icons/Translate';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import FlagIcon from '../../components/FlagIcon';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import { onboardingAddAccountRoute } from '../../routes';
import LangStore from '../../stores/lang';
import {
  getMainCountryForLocale,
  getUserLocales,
  Locale,
  Locales
} from '../../utils/i18n';

const riseIcon = require('../../images/rise_icon.svg');

// Labels are hard-coded here as we want to load the actual localization data
// after the user has selected the language, not before.
const localeLabels: { [P in Locale]: string } = {
  // de: 'Weiter auf Deutsch',
  en: 'Continue in English',
  // es: 'Continuar en español',
  et: 'Jätka eesti keeles',
  fr: 'Continuer en français',
  // it: 'Continua in italiano',
  // hu: 'Folytatás magyarul',
  nl: 'Ga door in het Nederlands',
  pl: 'Kontynuuj po polsku'
  // ro: 'Continuați în română',
  // ru: 'Продолжить на русском',
  // uk: 'Продовжуйте по-українськи',
  // zh: '繼續用中文',
};

const styles = createStyles({
  languageList: {
    maxWidth: 320
  },
  titleIcon: {
    margin: '-4px 4px'
  }
});

interface Props extends WithStyles<typeof styles> {}

interface PropsInjected extends Props {
  langStore: LangStore;
  routerStore: RouterStore;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingChooseLanguagePage'
});

@inject('langStore')
@inject('routerStore')
@observer
class ChooseLanguagePage extends React.Component<Props> {
  get injected(): PropsInjected {
    // @ts-ignore
    return this.props;
  }

  handleLanguageClicked = async (locale: Locale) => {
    const { routerStore, langStore } = this.injected;
    await langStore.changeLanguage(locale);
    routerStore.goTo(onboardingAddAccountRoute);
  }

  render() {
    // Order languages by browser preference
    const userLanguages = getUserLocales();
    let languages = Locales.map(locale => {
      return {
        locale: locale,
        countryCode: getMainCountryForLocale(locale),
        label: localeLabels[locale]
      };
    });
    languages.sort((a, b) => {
      let aIdx = userLanguages.indexOf(a.locale);
      let bIdx = userLanguages.indexOf(b.locale);

      if (aIdx < 0) {
        aIdx = userLanguages.length;
      }
      if (bIdx < 0) {
        bIdx = userLanguages.length;
      }
      return aIdx - bIdx;
    });

    const { classes } = this.injected;

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
              )
            }}
          />
        </ModalPaperHeader>
        <List className={classes.languageList}>
          {languages.map((lang, idx) => (
            <ListItem
              key={lang.locale}
              button={true}
              divider={idx + 1 === languages.length}
              onClick={this.handleLanguageClicked.bind(this, lang.locale)}
            >
              <FlagIcon countryCode={lang.countryCode} />
              <ListItemText>{lang.label}</ListItemText>
              <ChevronRightIcon />
            </ListItem>
          ))}
          <ListItem
            key="help-us"
            component="a"
            button={true}
            href="https://crowdin.com/project/rise-web-wallet"
            target="_blank"
          >
            <TranslateIcon />
            <ListItemText
              primary={
                <FormattedMessage
                  id="onboarding-choose-language.translate-cta-title"
                  description="Translate wallet call to action title"
                  defaultMessage="Missing your language?"
                />
              }
              secondary={
                <FormattedMessage
                  id="onboarding-choose-language.translate-cta"
                  description="Translate wallet call to action"
                  defaultMessage="Help us translate RISE wallet!"
                />
              }
            />
            <ChevronRightIcon />
          </ListItem>
        </List>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(ChooseLanguagePage);
