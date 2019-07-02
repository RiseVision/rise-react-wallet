import red from '@material-ui/core/es/colors/red';
import Divider from '@material-ui/core/es/Divider';
import List from '@material-ui/core/es/List';
import ListItem from '@material-ui/core/es/ListItem';
import ListItemSecondaryAction from '@material-ui/core/es/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/es/ListItemText';
import ListSubheader from '@material-ui/core/es/ListSubheader';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/es/styles';
import Switch from '@material-ui/core/es/Switch';
import { runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import Link from '../../components/Link';
import {
  accountSettingsNameRoute,
  accountSettingsRoute,
  accountSettingsPassphraseRoute,
  accountSettingsDelegateRoute,
  accountSettingsRemoveRoute,
  accountSettingsVoteRoute,
  accountSettingsFiatRoute,
  accountSettingsLedgerRoute
} from '../../routes';
import { accountStore } from '../../stores';
import AccountStore, { AccountType, LoadingState } from '../../stores/account';
import LedgerStore from '../../stores/ledger';
import { RouteLink } from '../../stores/root';
import WalletStore from '../../stores/wallet';
import AccountNameDialog from './AccountNameDialog';
import AddSecondPassphraseDialog from './AddSecondPassphraseDialog';
import ChooseFiatDialog from './ChooseFiatDialog';
import RegisterDelegateDialog from './RegisterDelegateDialog';
import RemoveAccountDialog from './RemoveAccountDialog';
import VerifyLedgerDialog from './VerifyLedgerDialog';
import VoteDelegateDialog from './VoteDelegateDialog';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      backgroundColor: theme.palette.background.paper,
      '& > button': {
        borderRadius: 0
      }
    },
    groupTitle: {
      backgroundColor: theme.palette.background.paper
    },
    toggleSecondary: {
      pointerEvents: 'none'
    },
    removeAccount: {
      color: red[500]
    }
  });

interface Props extends WithStyles<typeof styles> {
  account?: AccountStore;
}

interface PropsInjected extends Props {
  accountStore: AccountStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
  ledgerStore: LedgerStore;
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  delegateLoaded: boolean;
  registeredLoaded: boolean;
}

const stylesDecorator = withStyles(styles, { name: 'AccountOverview' });

const messages = defineMessages({
  loadingLabel: {
    id: 'account-settings.loading-label',
    description: 'Label for settings 2nd row while data is being loaded',
    defaultMessage: 'Loading...'
  },
  unnamedAccountLabel: {
    id: 'account-settings.unnamed-account-label',
    description: 'Label for accounts that user hasn\'t named yet',
    defaultMessage: 'Unnamed account ({id})'
  },
  accountName: {
    id: 'account-settings.account-name',
    description: 'Label for account name setting',
    defaultMessage: 'Account name'
  },
  pinnedAccount: {
    id: 'account-settings.pinned-account',
    description: 'Label for pinned account setting',
    defaultMessage: 'Pinned account'
  },
  pinnedAccountOnAria: {
    id: 'account-settings.pinned-account-on-aria',
    description: 'Accessibility label for pinned account setting',
    defaultMessage: 'Pinned account (press to unpin)'
  },
  pinnedAccountOffAria: {
    id: 'account-settings.pinned-account-off-aria',
    description: 'Accessibility label for pinned account setting',
    defaultMessage: 'Unpinned account (press to pin)'
  },
  votedDelegate: {
    id: 'account-settings.voted-delegate',
    description: 'Label for voted delegate setting',
    defaultMessage: 'Voted delegate'
  },
  votedDelegateUnsetLabel: {
    id: 'account-settings.voted-delegate-unset-label',
    description: 'Label for voted delegate unset',
    defaultMessage: 'None'
  },
  fiatCurrency: {
    id: 'account-settings.fiat-currency',
    description: 'Label for FIAT currency setting',
    defaultMessage: 'Displayed FIAT currency'
  },
  advancedSettings: {
    id: 'account-settings.advanced-settings',
    description: 'Title for advanced settings group',
    defaultMessage: 'Advanced settings'
  },
  passphrase: {
    id: 'account-settings.2nd-passphrase',
    description: 'Label for 2nd passphrase setting',
    defaultMessage: '2nd passphrase'
  },
  passphraseSetLabel: {
    id: 'account-settings.2nd-passphrase-set-label',
    description: 'Label for 2nd passphrase set',
    defaultMessage: 'Set'
  },
  passphraseUnsetLabel: {
    id: 'account-settings.2nd-passphrase-unset-label',
    description: 'Label for 2nd passphrase unset',
    defaultMessage: 'Not set'
  },
  delegateRegistration: {
    id: 'account-settings.delegate-registration',
    description: 'Label for delegate registration setting',
    defaultMessage: 'Delegate registration'
  },
  ledgerAddress: {
    id: 'account-settings.ledger-address',
    description:
      'Label for opening a dialog verifying the address on the ledger',
    defaultMessage: 'Verify Ledger Nano'
  },
  delegateRegistrationUnsetLabel: {
    id: 'account-settings.delegate-registration-unset-label',
    description: 'Label for delegate registration unset',
    defaultMessage: 'Not registered'
  },
  removeAccount: {
    id: 'account-settings.remove-account',
    description: 'Label for remove account setting',
    defaultMessage: 'Remove account from wallet'
  }
});

@inject(accountStore)
@inject('routerStore')
@inject('walletStore')
@inject('ledgerStore')
@observer
class AccountSettings extends React.Component<DecoratedProps, State> {
  state: State = {
    delegateLoaded: false,
    registeredLoaded: false
  };

  get injected(): PropsInjected & DecoratedProps {
    // @ts-ignore
    return this.props;
  }

  get account() {
    return this.injected.account || this.injected.accountStore;
  }

  // CLICK HANDLERS

  handleVerifyLedgerClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    this.injected.ledgerStore.open();
  }

  handlePinnedClicked = () => {
    runInAction(() => {
      const walletStore = this.injected.walletStore;
      const selectedAccount = walletStore.selectedAccount;
      selectedAccount.pinned = !selectedAccount.pinned;
    });
  }

  componentDidMount() {
    this.loadVotedDelegate();
    this.loadRegisteredDelegate();
  }

  loadVotedDelegate() {
    // load the delegate data only  once
    if (this.state.delegateLoaded) {
      return;
    }
    this.setState({ delegateLoaded: true });
    this.injected.walletStore.loadVotedDelegate(this.account.id);
  }

  loadRegisteredDelegate() {
    // load the registered name only once
    if (this.state.registeredLoaded) {
      return;
    }
    this.setState({ registeredLoaded: true });
    this.injected.walletStore.loadRegisteredDelegate(this.account.id);
  }

  render() {
    const { intl, classes, walletStore } = this.injected;
    const account = this.account;
    const { type: accountType } = account;

    const backLink: RouteLink = {
      route: accountSettingsRoute,
      params: {
        id: this.account.id
      }
    };

    return (
      <>
        <AccountNameDialog account={this.account} navigateBackLink={backLink} />
        <VoteDelegateDialog
          account={this.account}
          navigateBackLink={backLink}
        />
        <ChooseFiatDialog account={this.account} navigateBackLink={backLink} />
        <AddSecondPassphraseDialog
          account={this.account}
          navigateBackLink={backLink}
        />
        <RegisterDelegateDialog
          account={this.account}
          navigateBackLink={backLink}
        />
        <RemoveAccountDialog
          account={this.account}
          navigateBackLink={backLink}
        />
        <VerifyLedgerDialog
          account={this.account}
          navigateBackLink={backLink}
        />
        <div className={classes.content}>
          <List>
            <Link
              route={accountSettingsNameRoute}
              params={{
                id: this.account.id
              }}
            >
              <ListItem button={true}>
                <ListItemText
                  primary={intl.formatMessage(messages.accountName)}
                  secondary={
                    account.name ||
                    intl.formatMessage(messages.unnamedAccountLabel, {
                      id: this.account.localId
                    })
                  }
                />
              </ListItem>
            </Link>
            {walletStore.accounts.size >=
              walletStore.config.max_drawer_accounts && (
              <ListItem
                button={true}
                onClick={this.handlePinnedClicked}
                aria-label={intl.formatMessage(
                  account.pinned
                    ? messages.pinnedAccountOnAria
                    : messages.pinnedAccountOffAria
                )}
              >
                <ListItemText
                  primary={intl.formatMessage(messages.pinnedAccount)}
                />
                <ListItemSecondaryAction
                  className={classes.toggleSecondary}
                  aria-hidden={true}
                >
                  <Switch
                    onClick={this.handlePinnedClicked}
                    checked={account.pinned}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            )}
            {accountType !== AccountType.READONLY && (
              <Link
                route={accountSettingsVoteRoute}
                params={{
                  id: this.account.id
                }}
              >
                <ListItem button={true}>
                  <ListItemText
                    primary={intl.formatMessage(messages.votedDelegate)}
                    secondary={
                      account.votedDelegateState === LoadingState.LOADING
                        ? intl.formatMessage(messages.loadingLabel)
                        : account.votedDelegate
                          ? account.votedDelegate.username
                          : intl.formatMessage(messages.votedDelegateUnsetLabel)
                    }
                  />
                </ListItem>
              </Link>
            )}
            <Link
              route={accountSettingsFiatRoute}
              params={{
                id: this.account.id
              }}
            >
              <ListItem button={true}>
                <ListItemText
                  primary={intl.formatMessage(messages.fiatCurrency)}
                  secondary={account.fiatCurrency}
                />
              </ListItem>
            </Link>
          </List>
          <Divider />
          <List
            subheader={
              <ListSubheader className={classes.groupTitle}>
                {intl.formatMessage(messages.advancedSettings)}
              </ListSubheader>}
          >
            {accountType === AccountType.MNEMONIC && (
              <Link
                route={accountSettingsPassphraseRoute}
                params={{
                  id: this.account.id
                }}
              >
                <ListItem button={true}>
                  <ListItemText
                    primary={intl.formatMessage(messages.passphrase)}
                    secondary={
                      account.secondSignature
                        ? intl.formatMessage(messages.passphraseSetLabel)
                        : intl.formatMessage(messages.passphraseUnsetLabel)
                    }
                  />
                </ListItem>
              </Link>
            )}
            {accountType !== AccountType.READONLY && (
              <Link
                route={accountSettingsDelegateRoute}
                params={{
                  id: this.account.id
                }}
              >
                <ListItem button={true}>
                  <ListItemText
                    primary={intl.formatMessage(messages.delegateRegistration)}
                    secondary={
                      account.registeredDelegateState === LoadingState.LOADING
                        ? intl.formatMessage(messages.loadingLabel)
                        : account.registeredDelegate
                          ? account.registeredDelegate.username
                          : intl.formatMessage(
                              messages.delegateRegistrationUnsetLabel
                            )
                    }
                  />
                </ListItem>
              </Link>
            )}
            {accountType === AccountType.LEDGER && (
              <Link
                route={accountSettingsLedgerRoute}
                onClick={this.handleVerifyLedgerClick}
                params={{
                  id: this.account.id
                }}
              >
                <ListItem button={true}>
                  <ListItemText
                    primary={intl.formatMessage(messages.ledgerAddress)}
                  />
                </ListItem>
              </Link>
            )}
            <Link
              route={accountSettingsRemoveRoute}
              params={{
                id: this.account.id
              }}
            >
              <ListItem button={true}>
                <ListItemText
                  classes={{
                    primary: classes.removeAccount
                  }}
                  primary={intl.formatMessage(messages.removeAccount)}
                />
              </ListItem>
            </Link>
          </List>
        </div>
      </>
    );
  }
}

export default stylesDecorator(injectIntl(AccountSettings));
