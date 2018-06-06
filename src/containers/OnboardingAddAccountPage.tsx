import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Locale, getMainCountryForLocale } from '../utils/i18n';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ModalPaper from '../components/ModalPaper';
import ModalPaperHeader from '../components/ModalPaperHeader';
import FlagIcon from '../components/FlagIcon';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';

const riseIcon = require('../images/rise_icon.svg');

const styles = createStyles({
  titleIcon: {
    margin: '-4px 4px',
  },
});

interface Props extends WithStyles<typeof styles> {
  open: boolean;
  locale: Locale;
  onOpenChooseLanguage: () => void;
  onOpenNewAccount: () => void;
  onOpenExistingAccount: () => void;
}

const stylesDecorator = withStyles(styles, { name: 'OnboardingAddAccountPage' });

const OnboardingAddAccountPage = stylesDecorator(
  class extends React.Component<Props> {
    handleNewAccountClicked = () => {
      this.props.onOpenNewAccount();
    }

    handleExistingAccountClicked = () => {
      this.props.onOpenExistingAccount();
    }

    handleChooseLanguageClicked = () => {
      this.props.onOpenChooseLanguage();
    }

    render() {
      const { classes } = this.props;

      return (
        <ModalPaper open={this.props.open}>
          <ModalPaperHeader>
            <FormattedMessage
              id="onboarding-add-account.title"
              description="Add account screen title"
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
            <ListItem button={true} onClick={this.handleNewAccountClicked}>
              <ListItemText
                primary={(
                  <FormattedMessage
                    id="onboarding-add-account.new-account"
                    description="New account button title"
                    defaultMessage="New account"
                  />
                )}
                secondary={(
                  <FormattedMessage
                    id="onboarding-add-account.new-account-tip"
                    description="New account button tip"
                    defaultMessage="I want to create a new account on the RISE network"
                  />
                )}
              />
              <ChevronRight />
            </ListItem>
            <ListItem button={true} onClick={this.handleExistingAccountClicked}>
              <ListItemText
                primary={(
                  <FormattedMessage
                    id="onboarding-add-account.existing-account"
                    description="Existing account button title"
                    defaultMessage="Existing account"
                  />
                )}
                secondary={(
                  <FormattedMessage
                    id="onboarding-add-account.existing-account-tip"
                    description="Existing account button tip"
                    defaultMessage="I want to access an existing account on the RISE network"
                  />
                )}
              />
              <ChevronRight />
            </ListItem>
            <ListItem button={true} onClick={this.handleChooseLanguageClicked}>
              <FlagIcon countryCode={getMainCountryForLocale(this.props.locale)} />
              <ListItemText>
                <FormattedMessage
                  id="onboarding-add-account.change-language"
                  description="Change language button label"
                  defaultMessage="Change language"
                />
              </ListItemText>
              <ChevronRight />
            </ListItem>
          </List>
        </ModalPaper>
      );
    }
  }
);

export default OnboardingAddAccountPage;
