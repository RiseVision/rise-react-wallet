import { runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import { ReactElement } from 'react';
import * as React from 'react';
import {
  InjectedIntlProps,
  injectIntl,
  defineMessages,
} from 'react-intl';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import { accountOverviewRoute, onboardingAddAccountRoute } from '../../routes';
import RootStore from '../../stores/root';
import WalletStore from '../../stores/wallet';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Switch from '@material-ui/core/Switch';
import red from '@material-ui/core/colors/red';
import SettingsDialog from './SettingsDialog';
import NameForm, {
  State as NameState
} from '../../components/forms/SettingsName';
import RemoveAccountForm from '../../components/forms/SettingsRemoveAccount';
import PassphraseForm from '../../components/forms/SettingsPassphrase';
import FiatForm, {
  State as FiatState
} from '../../components/forms/SettingsFiat';
import VoteTransaction from './VoteTransaction';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      backgroundColor: theme.palette.background.paper,
      '& > button': {
        borderRadius: 0
      }
    },
    groupTitle: {
      backgroundColor: theme.palette.background.paper,
    },
    removeAccount: {
      color: red[500],
    },
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
  },
});

@inject('store')
@inject('walletStore')
@observer
class AccountSettings extends React.Component<DecoratedProps, State> {
  state = {
    dialogOpen: false,
    dialogField: null,
    delegateLoaded: false
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
    this.setState({ dialogOpen: true, dialogField: 'delegateRegistration' });
  }

  handleRemoveClicked = () => {
    this.setState({ dialogOpen: true, dialogField: 'removeAccount' });
  }

  onSubmitName = (state: NameState) => {
    this.props.walletStore!.updateAccountName(state.name!);
    this.onDialogClose();
  };

  onSubmitRemoveAccount = () => {
    let { store, walletStore } = this.props;

    walletStore!.removeAccount(walletStore!.selectedAccount!.id);
    this.onDialogClose();

    if (!walletStore!.selectedAccount) {
      store!.router.goTo(onboardingAddAccountRoute);
    } else {
      store!.router.goTo(accountOverviewRoute);
    }
  };

  onSubmitFiat = (state: FiatState) => {
    this.props.walletStore!.updateFiat(state.fiat!, state.global);
    this.onDialogClose();
  };

  onSubmitVote = () => {
    runInAction(() => {
      this.props.walletStore!.votedDelegate = null;
    });
    this.onDialogClose();
  };

  getDialog: () => {
    title: string | null;
    form: ReactElement<HTMLFormElement> | null;
  } = () => {
    const { store, walletStore } = this.props;
    const account = walletStore!.selectedAccount!;

    switch (this.state.dialogField!) {
      case 'name':
        return {
          title: 'Update account name',
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
          title: 'Remove account?',
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
          title: 'Setup 2nd passphrase',
          form: <PassphraseForm onSubmit={this.onDialogClose} />
        };
      case 'fiat':
        return {
          title: 'Displayed FIAT currency',
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
          title: 'Vote for Delegate',
          form: <VoteTransaction onSubmit={this.onSubmitVote} />
        };
      default:
        return {
          title: null,
          form: null
        };
    }
  };

  onDialogClose = () => {
    this.setState({ dialogOpen: false });
  };

  componentWillMount() {
    this.loadVote();
  }

  componentDidUpdate() {
    this.loadVote();
  }

  loadVote() {
    const store = this.props.walletStore!;
    // load the delegate data only if the account has been selected
    // and only once
    if (!this.props.walletStore!.selectedAccount!) {
      return;
    }
    if (this.state.delegateLoaded) return;
    this.setState({ delegateLoaded: true });
    store.loadVotedDelegate();
  }

  render() {
    const { intl, classes, walletStore } = this.props;
    const account = walletStore!.selectedAccount!;

    const dialog = this.getDialog();

    if (!account) {
      // TODO loading indicator
      return (
        <div className={classes.content}>
          <Typography>
            Loading
          </Typography>
        </div>
      );
    }

    return (
      <React.Fragment>
        <SettingsDialog
          title={dialog.title || ''}
          open={this.state.dialogOpen}
          onClose={this.onDialogClose}
        >
          {dialog.form}
        </SettingsDialog>
        <div className={classes.content}>
          <List>
            <ListItem button={true} onClick={this.handleNameClicked}>
              <ListItemText
                primary={intl.formatMessage(messages.accountName)}
                secondary={account.name || intl.formatMessage(messages.unnamedAccountLabel)}
              />
            </ListItem>
            <ListItem button={true} onClick={this.handlePinnedClicked}>
              <ListItemText primary={intl.formatMessage(messages.pinnedAccount)} />
              <ListItemSecondaryAction>
                <Switch
                  onClick={this.handlePinnedClicked}
                  checked={account.pinned}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem button={true} onClick={this.handleVoteClicked}>
              <ListItemText
                primary={intl.formatMessage(messages.votedDelegate)}
                secondary={


              /* TODO 'Loading' */
              walletStore!.votedDelegate === undefined
                ? 'Loading...'
                : walletStore!.votedDelegate
                  ? walletStore!.votedDelegate.username
                  : intl.formatMessage(messages.votedDelegateUnsetLabel)


                  }
              />
            </ListItem>
            <ListItem button={true} onClick={this.handleFiatClicked}>
              <ListItemText
                primary={intl.formatMessage(messages.fiatCurrency)}
                secondary={account.fiatCurrency}
              />
            </ListItem>
          </List>
          <Divider />
          <List
            subheader={(
              <ListSubheader className={classes.groupTitle}>
                {intl.formatMessage(messages.advancedSettings)}
              </ListSubheader>
            )}
          >
          <ListItem button={true} onClick={this.handlePassphraseClicked}>
              <ListItemText
                primary={intl.formatMessage(messages.passphrase)}
                secondary={account.secondSignature
                  ? intl.formatMessage(messages.passphraseSetLabel)
                  : intl.formatMessage(messages.passphraseUnsetLabel)}
              />
            </ListItem>
            <ListItem button={true} onClick={this.handleDelegateClicked}>
              <ListItemText
                primary={intl.formatMessage(messages.delegateRegistration)}
                secondary={'TODO / ' + intl.formatMessage(messages.delegateRegistrationUnsetLabel)}
              />
            </ListItem>
            <ListItem button={true} onClick={this.handleRemoveClicked}>
              <ListItemText
                classes={{
                  primary: classes.removeAccount,
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
