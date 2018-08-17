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
import { runInAction } from 'mobx';
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
import RemoveAccountForm from '../../components/forms/SettingsRemoveAccount';
import { accountOverviewRoute, onboardingAddAccountRoute } from '../../routes';
import { accountStore } from '../../stores';
import AccountStore from '../../stores/account';
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

interface Props extends WithStyles<typeof styles> {
  routerStore?: RouterStore;
  accountStore?: AccountStore;
  walletStore?: WalletStore;
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  dialogOpen: boolean;
  dialogField: string | null;
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
  state = {
    dialogOpen: false,
    dialogField: null,
    delegateLoaded: false,
    registeredLoaded: false
  };

  constructor(props: DecoratedProps) {
    super(props);
  }

  handleNameClicked = () => {
    this.setState({ dialogOpen: true, dialogField: 'name' });
  }

  handlePinnedClicked = () => {
    runInAction(() => {
      const walletStore = this.props.walletStore!;
      const selectedAccount = walletStore.selectedAccount;
      selectedAccount.pinned = !selectedAccount.pinned;
      // TODO handle by observable
      walletStore.saveAccount(selectedAccount);
    });
  }

  handleVoteClicked = () => {
    this.setState({ dialogOpen: true, dialogField: 'delegate' });
  }

  handleFiatClicked = () => {
    this.setState({ dialogOpen: true, dialogField: 'fiat' });
  }

  handlePassphraseClicked = () => {
    this.setState({ dialogOpen: true, dialogField: 'passphrase' });
  }

  handleDelegateClicked = () => {
    // open only the registered delegate info has been loaded
    const account = this.props.walletStore!.selectedAccount;
    if (account.registeredDelegate === undefined) {
      return;
    }
    this.setState({ dialogOpen: true, dialogField: 'delegateRegistration' });
  }

  handleRemoveClicked = () => {
    this.setState({ dialogOpen: true, dialogField: 'removeAccount' });
  }

  onSubmitName = (state: NameState) => {
    this.props.walletStore!.updateAccountName(state.name!);
    this.onDialogClose();
  }

  onSubmitRemoveAccount = () => {
    let { routerStore, walletStore } = this.props;

    walletStore!.removeAccount(walletStore!.selectedAccount.id);
    this.onDialogClose();

    if (!walletStore!.selectedAccount) {
      routerStore!.goTo(onboardingAddAccountRoute);
    } else {
      routerStore!.goTo(accountOverviewRoute);
    }
  }

  onSubmitFiat = (state: FiatState) => {
    this.props.walletStore!.updateFiat(state.fiat!, state.global);
    this.onDialogClose();
  }

  onSubmitVote = () => {
    const account = this.props.walletStore!.selectedAccount;
    runInAction(() => {
      account.votedDelegate = null;
    });
    this.onDialogClose();
  }

  onSubmitRegister = (tx?: TTransactionResult) => {
    // refresh in case the registration actually happened
    const account = this.props.walletStore!.selectedAccount;
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
    const config = this.props.walletStore!.config;
    const account = this.props.accountStore!;

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
              id={account.id}
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
    this.setState({ dialogOpen: false });
  }

  componentWillMount() {
    this.loadVotedDelegate();
    this.loadRegisteredDelegate();
  }

  componentDidUpdate() {
    // required bc of lack of wallet.selectedAccount during componentWillMount
    this.loadVotedDelegate();
    this.loadRegisteredDelegate();
  }

  loadVotedDelegate() {
    const store = this.props.walletStore!;
    // load the delegate data only  once
    const account = this.props.walletStore!.selectedAccount;
    if (this.state.delegateLoaded) {
      return;
    }
    this.setState({ delegateLoaded: true });
    store.loadVotedDelegate(account.id);
  }

  loadRegisteredDelegate() {
    const store = this.props.walletStore!;
    // load the registered name only once
    const account = this.props.walletStore!.selectedAccount;
    if (this.state.registeredLoaded) {
      return;
    }
    this.setState({ registeredLoaded: true });
    store.loadRegisteredDelegate(account.id);
  }

  render() {
    const { intl, classes, walletStore } = this.props;
    const account = walletStore!.selectedAccount;

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
                    account.votedDelegate === undefined
                      ? 'Loading...'
                      : account.votedDelegate
                        ? account.votedDelegate!.username
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
                    account.registeredDelegate === undefined
                      ? 'Loading...'
                      : account.registeredDelegate
                        ? account.registeredDelegate!.username
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
