import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';
import FlagIcon from '../components/FlagIcon';
import { Locale, Locales, getUserLocales, getMainCountryForLocale } from '../utils/i18n';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';

const riseIcon = require('../images/rise_icon.svg');

// Labels are hard-coded here as we want to load the actual localization data
// after the user has selected the language, not before.
const localeLabels: {
  [P in Locale]: string;
} = {
  en: 'Continue in English',
  et: 'Jätka eesti keeles',
  ko: '한국어로 시작하기',
};

const styles = createStyles({
  titleIcon: {
    margin: '-4px 4px',
  },
});

interface Props extends WithStyles<typeof styles> {
  open: boolean;
  onLanguageSelected: (locale: Locale) => void;
}

const stylesDecorator = withStyles(styles, { name: 'OnboardingChooseLanguagePage' });

const OnboardingChooseLanguagePage = stylesDecorator(
  class extends React.Component<Props> {
    handleLanguageClicked = (locale: Locale) => {
      this.props.onLanguageSelected(locale);
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
        <ModalPaper open={this.props.open}>
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
);

export default OnboardingChooseLanguagePage;
