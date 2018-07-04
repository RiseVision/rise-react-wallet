import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import {
  onboardingChooseLanguageRoute,
  onboardingExistingAccountRoute,
  onboardingNewAccountRoute
} from '../routes';
import Store from '../store';
import { getMainCountryForLocale } from '../utils/i18n';
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
  store?: Store;
}

const stylesDecorator = withStyles(styles, { name: 'OnboardingAddAccountPage' });

@inject('store')
@observer
class OnboardingAddAccountPage extends React.Component<Props> {
  handleNewAccountClicked = () => {
    this.props.store!.router.goTo(onboardingNewAccountRoute);
  }

  handleExistingAccountClicked = () => {
    this.props.store!.router.goTo(onboardingExistingAccountRoute);
  }

  handleChooseLanguageClicked = () => {
    this.props.store!.router.goTo(onboardingChooseLanguageRoute);
  }

  render() {
    const { classes, store } = this.props;

    return (
      <ModalPaper open={true}>
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
            <FlagIcon countryCode={getMainCountryForLocale(store!.locale)} />
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

// TODO make it a decorator
export default stylesDecorator(OnboardingAddAccountPage);
