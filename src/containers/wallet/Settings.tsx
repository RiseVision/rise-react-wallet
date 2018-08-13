import { runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import { ReactElement } from 'react';
import * as React from 'react';
import { InjectedIntlProps, injectIntl, defineMessages } from 'react-intl';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import { accountOverviewRoute, onboardingAddAccountRoute } from '../../routes';
import RootStore from '../../stores/root';
import WalletStore, { TTransactionResult } from '../../stores/wallet';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Switch from '@material-ui/core/Switch';
import red from '@material-ui/core/colors/red';
import Dialog from '../../components/Dialog';
import NameForm, {
  State as NameState
} from '../../components/forms/SettingsName';
import RemoveAccountForm from '../../components/forms/SettingsRemoveAccount';
import PassphraseForm from '../../components/forms/SettingsPassphrase';
import FiatForm, {
  State as FiatState
} from '../../components/forms/SettingsFiat';
import VoteDelegate from './VoteDelegate';
import RegisterDelegate from './RegisterDelegate';
import { FormattedMessage } from 'react-intl';

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
  store?: RootStore;
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

@inject('store')
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
      const selectedAccount = walletStore.selectedAccount!;
      selectedAccount.pinned = !selectedAccount.pinned;
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
    if (this.props.walletStore!.registeredDelegate === undefined) {
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
    let { store, walletStore } = this.props;

    walletStore!.removeAccount(walletStore!.selectedAccount!.id);
    this.onDialogClose();

    if (!walletStore!.selectedAccount) {
      store!.router.goTo(onboardingAddAccountRoute);
    } else {
      store!.router.goTo(accountOverviewRoute);
    }
  }

  onSubmitFiat = (state: FiatState) => {
    this.props.walletStore!.updateFiat(state.fiat!, state.global);
    this.onDialogClose();
  }

  onSubmitVote = () => {
    runInAction(() => {
      this.props.walletStore!.votedDelegate = null;
    });
    this.onDialogClose();
  }

  onSubmitRegister = (tx?: TTransactionResult) => {
    // refresh in case the registration actually happened
    if (tx && tx.success) {
      runInAction(() => {
        this.props.walletStore!.registeredDelegate = null;
      });
    }
    this.onDialogClose();
  }

  getDialog: () => {
    title: ReactElement<HTMLElement> | null;
    form: ReactElement<HTMLFormElement> | null;
  } = () => {
    const { store, walletStore } = this.props;
    const account = walletStore!.selectedAccount!;

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
          form: <PassphraseForm onSubmit={this.onDialogClose} />
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
              options={store!.config.fiat_currencies}
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
    // load the delegate data only if the account has been selected
    // and only once
    if (!this.props.walletStore!.selectedAccount!) {
      return;
    }
    if (this.state.delegateLoaded) {
      return;
    }
    this.setState({ delegateLoaded: true });
    store.loadVotedDelegate();
  }

  loadRegisteredDelegate() {
    const store = this.props.walletStore!;
    // load the registered name only if the account has been selected
    // and only once
    if (!this.props.walletStore!.selectedAccount!) {
      return;
    }
    if (this.state.registeredLoaded) {
      return;
    }
    this.setState({ registeredLoaded: true });
    store.loadRegisteredDelegate();
  }

  render() {
    const { intl, classes, walletStore } = this.props;
    const account = walletStore!.selectedAccount!;

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
                    walletStore!.votedDelegate === undefined
                      ? 'Loading...'
                      : walletStore!.votedDelegate
                        ? walletStore!.votedDelegate!.username
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
                    walletStore!.registeredDelegate === undefined
                      ? 'Loading...'
                      : walletStore!.registeredDelegate
                        ? walletStore!.registeredDelegate!.username
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
