import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import AppsIcon from '@material-ui/icons/Apps';
import ChevronRight from '@material-ui/icons/ChevronRight';
import ServerNetworkIcon from 'mdi-material-ui/ServerNetwork';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import FlagIcon from '../../components/FlagIcon';
import Link from '../../components/Link';
import ModalPaper from '../../components/ModalPaper';
import ModalPaperHeader from '../../components/ModalPaperHeader';
import {
  onboardingChooseLanguageRoute,
  onboardingExistingAccountRoute,
  onboardingLedgerAccount,
  onboardingSecurityNoticeRoute,
  accountOverviewNoIDRoute,
  onboardingChooseNetworkRoute,
  onboardingInstallToHomeScreenRoute
} from '../../routes';
import LangStore from '../../stores/lang';
import LedgerStore from '../../stores/ledger';
import OnboardingStore from '../../stores/onboarding';
import WalletStore from '../../stores/wallet';
import { getMainCountryForLocale } from '../../utils/i18n';

const riseIcon = require('../../images/rise_icon.svg');

const styles = createStyles({
  titleIcon: {
    margin: '-4px 4px'
  },
  nodeIcon: {
    margin: '0 3px',
    color: '#999'
  }
});

interface Props extends WithStyles<typeof styles> {}

interface PropsInjected extends Props {
  langStore: LangStore;
  onboardingStore: OnboardingStore;
  walletStore: WalletStore;
  ledgerStore: LedgerStore;
}

const stylesDecorator = withStyles(styles, {
  name: 'OnboardingAddAccountPage'
});

@inject('langStore')
@inject('onboardingStore')
@inject('walletStore')
@inject('ledgerStore')
@observer
class AddAccountPage extends React.Component<Props> {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  handleBeforeNavigate = () => {
    const { onboardingStore } = this.injected;
    onboardingStore.reset();
  }

  handleAddLedgerClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    this.injected.ledgerStore.open();
  }

  render() {
    const { classes, langStore, walletStore } = this.injected;
    const showClose = [...walletStore.accounts.keys()].length > 0;
    let network;

    switch (walletStore.getNetwork()) {
      case 'mainnet':
        network = (
          <FormattedMessage
            id="onboarding-add-account.official-main-network"
            description="Label for a main network"
            defaultMessage="official mainnet"
          />
        );
        break;
      case 'testnet':
        network = (
          <FormattedMessage
            id="onboarding-add-account.official-test-network"
            description="Label for a test network"
            defaultMessage="official testnet"
          />
        );
        break;
      case 'custom':
        network = (
          <FormattedMessage
            id="onboarding-add-account.custom-network"
            description="Label for a custom network"
            defaultMessage="custom"
          />
        );
        break;
    }

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
            route={onboardingSecurityNoticeRoute}
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
            route={onboardingLedgerAccount}
            onBeforeNavigate={this.handleBeforeNavigate}
            onClick={this.handleAddLedgerClick}
          >
            <ListItem button={true}>
              <ListItemText
                primary={
                  <FormattedMessage
                    id="onboarding-add-account.hw-wallet-account"
                    description="Hardware wallet account button title"
                    defaultMessage="Hardware wallet account"
                  />
                }
                secondary={
                  <FormattedMessage
                    id="onboarding-add-account.hw-wallet-account-tip"
                    description="Hardware wallet account button tip"
                    defaultMessage="I want to import an account from my Ledger device"
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
                countryCode={getMainCountryForLocale(langStore.locale)}
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
          {walletStore.isMobile &&
            !walletStore.isHomeScreen && (
              <Link
                route={onboardingInstallToHomeScreenRoute}
                onBeforeNavigate={this.handleBeforeNavigate}
              >
                <ListItem button={true}>
                  <AppsIcon className={classes.nodeIcon} />
                  <ListItemText>
                    <FormattedMessage
                      id="onboarding-add-account.install-to-homescreen"
                      description="Install to homescreen button label"
                      defaultMessage="Install to Home Screen"
                    />
                  </ListItemText>
                  <ChevronRight />
                </ListItem>
              </Link>
            )}
          {!walletStore.isMobile &&
            walletStore.supportsA2HS &&
            !walletStore.isHomeScreen && (
              <Link
                route={onboardingInstallToHomeScreenRoute}
                onBeforeNavigate={this.handleBeforeNavigate}
              >
                <ListItem button={true}>
                  <AppsIcon className={classes.nodeIcon} />
                  <ListItemText>
                    <FormattedMessage
                      id="onboarding-add-account.install-to-desktop"
                      description="Install to desktop button label"
                      defaultMessage="Install to Desktop"
                    />
                  </ListItemText>
                  <ChevronRight />
                </ListItem>
              </Link>
            )}
          <Link
            route={onboardingChooseNetworkRoute}
            onBeforeNavigate={this.handleBeforeNavigate}
          >
            <ListItem button={true}>
              <ServerNetworkIcon className={classes.nodeIcon} />
              <ListItemText>
                <FormattedMessage
                  id="onboarding-add-account.select-node"
                  description="Change node button label"
                  defaultMessage="Change node ({name})"
                  values={{ name: network }}
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
