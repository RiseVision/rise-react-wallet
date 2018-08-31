import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import ChevronRight from '@material-ui/icons/ChevronRight';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import FlagIcon from '../../components/FlagIcon';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import {
  onboardingChooseLanguageRoute,
  onboardingExistingAccountRoute,
  onboardingNewAccountRoute,
  accountOverviewNoIDRoute
} from '../../routes';
import AppStore from '../../stores/app';
import OnboardingStore from '../../stores/onboarding';
import WalletStore from '../../stores/wallet';
import { getMainCountryForLocale } from '../../utils/i18n';

const riseIcon = require('../../images/rise_icon.svg');

const styles = createStyles({
  titleIcon: {
    margin: '-4px 4px'
  }
});

interface Props extends WithStyles<typeof styles> {}

interface PropsInjected extends Props {
  appStore: AppStore;
  onboardingStore: OnboardingStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingAddAccountPage'
});

@inject('appStore')
@inject('onboardingStore')
@inject('routerStore')
@inject('walletStore')
@observer
class AddAccountPage extends React.Component<Props> {
  get injected(): PropsInjected {
    // @ts-ignore
    return this.props;
  }

  handleCloseClicked = () => {
    const { routerStore, onboardingStore } = this.injected;
    onboardingStore.reset();
    routerStore.goTo(accountOverviewNoIDRoute);
  }

  handleNewAccountClicked = () => {
    const { routerStore, onboardingStore } = this.injected;
    onboardingStore.reset();
    routerStore.goTo(onboardingNewAccountRoute);
  }

  handleExistingAccountClicked = () => {
    const { routerStore, onboardingStore } = this.injected;
    onboardingStore.reset();
    routerStore.goTo(onboardingExistingAccountRoute);
  }

  handleChooseLanguageClicked = () => {
    const { routerStore, onboardingStore } = this.injected;
    onboardingStore.reset();
    routerStore.goTo(onboardingChooseLanguageRoute);
  }

  render() {
    const { classes, appStore, walletStore } = this.injected;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader
          closeButton={[...walletStore.accounts.keys()].length > 0}
          onCloseClick={this.handleCloseClicked}
        >
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
              )
            }}
          />
        </ModalPaperHeader>
        <List>
          <ListItem button={true} onClick={this.handleNewAccountClicked}>
            <ListItemText
              primary={
                <FormattedMessage
                  id="onboarding-add-account.new-account"
                  description="New account button title"
                  defaultMessage="New account"
                />
              }
              secondary={
                <FormattedMessage
                  id="onboarding-add-account.new-account-tip"
                  description="New account button tip"
                  defaultMessage="I want to create a new account on the RISE network"
                />
              }
            />
            <ChevronRight />
          </ListItem>
          <ListItem button={true} onClick={this.handleExistingAccountClicked}>
            <ListItemText
              primary={
                <FormattedMessage
                  id="onboarding-add-account.existing-account"
                  description="Existing account button title"
                  defaultMessage="Existing account"
                />
              }
              secondary={
                <FormattedMessage
                  id="onboarding-add-account.existing-account-tip"
                  description="Existing account button tip"
                  defaultMessage="I want to access an existing account on the RISE network"
                />
              }
            />
            <ChevronRight />
          </ListItem>
          <ListItem button={true} onClick={this.handleChooseLanguageClicked}>
            <FlagIcon countryCode={getMainCountryForLocale(appStore.locale)} />
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

export default stylesDecorator(AddAccountPage);
