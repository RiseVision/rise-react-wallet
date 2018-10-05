import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import ChevronRight from '@material-ui/icons/ChevronRight';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Link from '../../components/Link';
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
  walletStore: WalletStore;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingAddAccountPage'
});

@inject('appStore')
@inject('onboardingStore')
@inject('walletStore')
@observer
class AddAccountPage extends React.Component<Props> {
  get injected(): PropsInjected {
    // @ts-ignore
    return this.props;
  }

  handleBeforeNavigate = () => {
    const { onboardingStore } = this.injected;
    onboardingStore.reset();
  }

  render() {
    const { classes, appStore, walletStore } = this.injected;
    const showClose = [...walletStore.accounts.keys()].length > 0;

    return (
      <ModalPaper open={true}>
        <ModalPaperHeader
          closeLink={
            showClose
              ? {
                  route: accountOverviewNoIDRoute,
                  onBeforeNavigate: this.handleBeforeNavigate
                }
              : undefined
          }
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
          <Link
            route={onboardingNewAccountRoute}
            onBeforeNavigate={this.handleBeforeNavigate}
          >
            <ListItem button={true}>
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
          </Link>
          <Link
            route={onboardingExistingAccountRoute}
            onBeforeNavigate={this.handleBeforeNavigate}
          >
            <ListItem button={true}>
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
          </Link>
          <Link
            route={onboardingChooseLanguageRoute}
            onBeforeNavigate={this.handleBeforeNavigate}
          >
            <ListItem button={true}>
              <FlagIcon
                countryCode={getMainCountryForLocale(appStore.locale)}
              />
              <ListItemText>
                <FormattedMessage
                  id="onboarding-add-account.change-language"
                  description="Change language button label"
                  defaultMessage="Change language"
                />
              </ListItemText>
              <ChevronRight />
            </ListItem>
          </Link>
        </List>
      </ModalPaper>
    );
  }
}

export default stylesDecorator(AddAccountPage);
