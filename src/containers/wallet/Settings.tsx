import red from '@material-ui/core/colors/red';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import { runInAction, action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import { ReactElement } from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import Dialog from '../../components/Dialog';
import FiatForm, {
  State as FiatState
} from '../../components/forms/SettingsFiat';
import NameForm, {
  State as NameState
} from '../../components/forms/SettingsName';
import RemoveAccountForm from '../../components/forms/SettingsRemoveAccountForm';
import {
  accountOverviewRoute,
  onboardingAddAccountRoute,
  accountSettingsNameRoute,
  accountSettingsRoute,
  accountSettingsPassphraseRoute,
  accountSettingsDelegateRoute,
  accountSettingsRemoveRoute,
  accountSettingsVoteRoute,
  accountSettingsFiatRoute
} from '../../routes';
import { accountStore } from '../../stores';
import AccountStore, { LoadingState } from '../../stores/account';
import WalletStore, { TTransactionResult } from '../../stores/wallet';
import SettingsPassphrase from './SettingsPassphrase';
import RegisterDelegate from './RegisterDelegate';
import VoteDelegate from './VoteDelegate';

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
    removeAccount: {
      color: red[500]
    }
  });

export enum DialogField {
  NAME = 'name',
  DELEGATE_VOTE = 'delegate',
  FIAT = 'fiat',
  PASSPHRASE = 'passphrase',
  DELEGATE_REGISTRATION = 'delegateRegistration',
  REMOVE_ACCOUNT = 'removeAccount'
}

interface Props extends WithStyles<typeof styles> {
  account?: AccountStore;
  openDialog?: DialogField;
}

interface PropsInjected extends Props {
  accountStore: AccountStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  dialogOpen: boolean;
  dialogField: DialogField | null;
  delegateLoaded: boolean;
  registeredLoaded: boolean;
}

const stylesDecorator = withStyles(styles, { name: 'AccountOverview' });

const messages = defineMessages({
  unnamedAccountLabel: {
    id: 'account-settings.unnamed-account-label',
    description: 'Label for accounts that user hasn\'t named yet',
    defaultMessage: 'Unnamed account'
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
@observer
class AccountSettings extends React.Component<DecoratedProps, State> {
  state: State = {
    dialogOpen: false,
    dialogField: null,
    delegateLoaded: false,
    registeredLoaded: false
  };

  static getDerivedStateFromProps(
    nextProps: Props,
    prevState: State
  ): Partial<State> | null {
    if (
      nextProps.openDialog &&
      prevState.dialogField !== nextProps.openDialog
    ) {
      // open a dialog
      return { dialogField: nextProps.openDialog, dialogOpen: true };
    } else if (!nextProps.openDialog) {
      // close a dialog
      return { dialogOpen: false, dialogField: null };
    } else {
      return null;
    }
  }

  get injected(): PropsInjected & DecoratedProps {
    // @ts-ignore
    return this.props;
  }

  get account() {
    return this.injected.account || this.injected.accountStore;
  }

  constructor(props: DecoratedProps) {
    super(props);
    if (props.openDialog) {
      this.state.dialogField = props.openDialog;
      this.state.dialogOpen = true;
    }
  }

  // CLICK HANDLERS

  handleNameClicked = () => {
    const id = this.account.id;
    this.injected.routerStore.goTo(accountSettingsNameRoute, { id });
  }

  handlePinnedClicked = () => {
    runInAction(() => {
      const walletStore = this.injected.walletStore;
      const selectedAccount = walletStore.selectedAccount;
      selectedAccount.pinned = !selectedAccount.pinned;
    });
  }

  handleVoteClicked = () => {
    const id = this.account.id;
    this.injected.routerStore.goTo(accountSettingsVoteRoute, { id });
  }

  handleFiatClicked = () => {
    const id = this.account.id;
    this.injected.routerStore.goTo(accountSettingsFiatRoute, { id });
  }

  handlePassphraseClicked = () => {
    const id = this.account.id;
    this.injected.routerStore.goTo(accountSettingsPassphraseRoute, { id });
  }

  handleDelegateClicked = () => {
    // open only if the registered delegate info has been loaded
    if (this.account.registeredDelegateState !== LoadingState.LOADED) {
      return;
    }
    const id = this.account.id;
    this.injected.routerStore.goTo(accountSettingsDelegateRoute, { id });
  }

  handleRemoveClicked = () => {
    const id = this.account.id;
    this.injected.routerStore.goTo(accountSettingsRemoveRoute, { id });
  }

  // DIALOG ACTIONS

  @action
  onSubmitName = (state: NameState) => {
    // TOOD validate state.name
    this.account.name = state.name!;
    this.onDialogClose();
  }

  onSubmitRemoveAccount = () => {
    let { routerStore, walletStore } = this.injected;

    walletStore.removeAccount(this.account.id);
    this.onDialogClose();

    if (!walletStore.selectedAccount) {
      routerStore.goTo(onboardingAddAccountRoute);
    } else {
      routerStore.goTo(accountOverviewRoute, {
        id: walletStore.selectedAccount.id
      });
    }
  }

  @action
  onSubmitFiat = (state: FiatState) => {
    // TODO validate state.fiat
    const wallet = this.injected.walletStore;
    if (global) {
      for (const account of [...wallet.accounts.values()]) {
        account.fiatCurrency = state.fiat!;
      }
    } else {
      this.account.fiatCurrency = state.fiat!;
    }
    this.onDialogClose();
  }

  @action
  onSubmitVote = () => {
    this.onDialogClose();
  }

  onSubmitRegister = (tx?: TTransactionResult) => {
    // refresh in case the registration actually happened
    const account = this.injected.walletStore.selectedAccount;
    if (tx && tx.success) {
      runInAction(() => {
        account.registeredDelegate = null;
      });
    }
    this.onDialogClose();
  }

  getDialog: () => {
    title: ReactElement<HTMLElement> | null;
    form: ReactElement<HTMLFormElement> | null;
  } = () => {
    const config = this.injected.walletStore.config;
    const account = this.injected.accountStore;

    switch (this.state.dialogField!) {
      case 'name':
        return {
          title: (
            <FormattedMessage
              id="settings-dialog-title"
              defaultMessage={'Update account name'}
            />
          ),
          form: (
            <NameForm
              name={account.name!}
              id={account.id}
              onSubmit={this.onSubmitName}
            />
          )
        };
      case 'removeAccount':
        return {
          title: (
            <FormattedMessage
              id="settings-dialog-title"
              defaultMessage={'Remove account?'}
            />
          ),
          form: (
            <RemoveAccountForm
              name={account.name}
              address={account.id}
              onSubmit={this.onSubmitRemoveAccount}
            />
          )
        };
      case 'passphrase':
        return {
          title: (
            <FormattedMessage
              id="settings-dialog-title"
              defaultMessage={'Setup 2nd passphrase'}
            />
          ),
          form: <SettingsPassphrase onSubmit={this.onDialogClose} />
        };
      case 'fiat':
        return {
          title: (
            <FormattedMessage
              id="settings-dialog-title"
              defaultMessage={'Displayed FIAT currency'}
            />
          ),
          form: (
            <FiatForm
              fiat={account.fiatCurrency}
              options={config.fiat_currencies}
              onSubmit={this.onSubmitFiat}
            />
          )
        };
      case 'delegate':
        return {
          title: (
            <FormattedMessage
              id="settings-dialog-title"
              defaultMessage={'Vote for Delegate'}
            />
          ),
          form: <VoteDelegate onSubmit={this.onSubmitVote} />
        };
      case 'delegateRegistration':
        return {
          title: (
            <FormattedMessage
              id="settings-dialog-title"
              defaultMessage={'Delegate Registration'}
            />
          ),
          form: <RegisterDelegate onSubmit={this.onSubmitRegister} />
        };
      default:
        return {
          title: null,
          form: null
        };
    }
  }

  onDialogClose = () => {
    this.injected.routerStore.goTo(accountSettingsRoute, { id: this.account.id });
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
    const { intl, classes } = this.injected;
    const account = this.account;

    if (!account) {
      // TODO loading indicator
      return (
        <div className={classes.content}>
          <Typography>Loading</Typography>
        </div>
      );
    }

    const readOnly = account.readOnly;
    const dialog = this.getDialog();

    return (
      <React.Fragment>
        <Dialog
          title={dialog.title}
          open={this.state.dialogOpen}
          onClose={this.onDialogClose}
        >
          {dialog.form}
        </Dialog>
        <div className={classes.content}>
          <List>
            <ListItem button={true} onClick={this.handleNameClicked}>
              <ListItemText
                primary={intl.formatMessage(messages.accountName)}
                secondary={
                  account.name ||
                  intl.formatMessage(messages.unnamedAccountLabel)
                }
              />
            </ListItem>
            <ListItem button={true} onClick={this.handlePinnedClicked}>
              <ListItemText
                primary={intl.formatMessage(messages.pinnedAccount)}
              />
              <ListItemSecondaryAction>
                <Switch
                  onClick={this.handlePinnedClicked}
                  checked={account.pinned}
                />
              </ListItemSecondaryAction>
            </ListItem>
            {!readOnly && (
              <ListItem button={true} onClick={this.handleVoteClicked}>
                <ListItemText
                  primary={intl.formatMessage(messages.votedDelegate)}
                  secondary={
                    /* TODO translate 'Loading' */
                    account.votedDelegateState === LoadingState.LOADING
                      ? 'Loading...'
                      : account.votedDelegate
                        ? account.votedDelegate.username
                        : intl.formatMessage(messages.votedDelegateUnsetLabel)
                  }
                />
              </ListItem>
            )}
            <ListItem button={true} onClick={this.handleFiatClicked}>
              <ListItemText
                primary={intl.formatMessage(messages.fiatCurrency)}
                secondary={account.fiatCurrency}
              />
            </ListItem>
          </List>
          <Divider />
          <List
            subheader={
              <ListSubheader className={classes.groupTitle}>
                {intl.formatMessage(messages.advancedSettings)}
              </ListSubheader>}
          >
            {!readOnly && (
              <ListItem button={true} onClick={this.handlePassphraseClicked}>
                <ListItemText
                  primary={intl.formatMessage(messages.passphrase)}
                  secondary={
                    account.secondSignature
                      ? intl.formatMessage(messages.passphraseSetLabel)
                      : intl.formatMessage(messages.passphraseUnsetLabel)
                  }
                />
              </ListItem>
            )}
            {!readOnly && (
              <ListItem button={true} onClick={this.handleDelegateClicked}>
                <ListItemText
                  primary={intl.formatMessage(messages.delegateRegistration)}
                  secondary={
                    /* TODO translate 'Loading' */
                    account.registeredDelegateState === LoadingState.LOADING
                      ? 'Loading...'
                      : account.registeredDelegate
                        ? account.registeredDelegate.username
                        : intl.formatMessage(
                            messages.delegateRegistrationUnsetLabel
                          )
                  }
                />
              </ListItem>
            )}
            <ListItem button={true} onClick={this.handleRemoveClicked}>
              <ListItemText
                classes={{
                  primary: classes.removeAccount
                }}
                primary={intl.formatMessage(messages.removeAccount)}
              />
            </ListItem>
          </List>
        </div>
      </React.Fragment>
    );
  }
}

export default stylesDecorator(injectIntl(AccountSettings));
