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

const styles = (theme: Theme) =>
  createStyles({
    content: {
      flexGrow: 1,
      backgroundColor: theme.palette.background.paper,
      padding: theme.spacing.unit * 2,
      '& > button': {
        borderRadius: 0
      }
    },
    groupTitle: {
      marginTop: theme.spacing.unit * 2,
      marginBottom: theme.spacing.unit,
      ['&:first-child']: {
        marginTop: 0
      }
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
}

const stylesDecorator = withStyles(styles, { name: 'AccountOverview' });

const messages = defineMessages({
  unnamedAccountLabel: {
    id: 'account-settings.unnamed-account-label',
    description: 'Label for accounts that user hasn\'t named yet',
    defaultMessage: 'Unnamed account'
  },
});

@inject('store')
@inject('walletStore')
@observer
/**
 * TODO Translate
 */
class AccountSettings extends React.Component<DecoratedProps, State> {
  state = {
    dialogOpen: false,
    dialogField: null
  };

  constructor(props: DecoratedProps) {
    super(props);
  }

  handleFieldClick = (field: string) => {
    if (field === 'pinned') {
      runInAction(() => {
        const walletStore = this.props.walletStore!;
        const selectedAccount = walletStore.selectedAccount!;
        selectedAccount.pinned = !selectedAccount.pinned;
        walletStore.saveAccount(selectedAccount);
      });
    } else {
      this.setState({ dialogOpen: true, dialogField: field });
    }
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

  render() {
    const { intl, classes, walletStore } = this.props;
    const account = walletStore!.selectedAccount!;
    const unnamedAccountLabel = intl.formatMessage(messages.unnamedAccountLabel);

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
            <ListItem button={true} onClick={() => this.handleFieldClick('name')}>
              <ListItemText primary="Account name" secondary={account.name || unnamedAccountLabel} />
            </ListItem>
            <ListItem button={true} onClick={() => this.handleFieldClick('pinned')}>
              <ListItemText primary="Pinned account" />
              <ListItemSecondaryAction>
                <Switch
                  onClick={() => this.handleFieldClick('pinned')}
                  checked={account.pinned}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem button={true} onClick={() => this.handleFieldClick('delegate')}>
              <ListItemText primary="Voted delegate" secondary="TODO" />
            </ListItem>
            <ListItem button={true} onClick={() => this.handleFieldClick('fiat')}>
              <ListItemText primary="Displayed FIAT currency" secondary={account.fiatCurrency} />
            </ListItem>
          </List>
          <List
            subheader={(
              <ListSubheader>Advanced settings</ListSubheader>
            )}
          >
          <ListItem button={true} onClick={() => this.handleFieldClick('passphrase')}>
              <ListItemText
                primary="2nd passphrase"
                secondary={account.secondSignature ? 'Set' : 'Not set'}
              />
            </ListItem>
            <ListItem button={true} onClick={() => this.handleFieldClick('delegateRegistration')}>
              <ListItemText primary="Delegate registration" secondary="TODO" />
            </ListItem>
            <ListItem button={true} onClick={() => this.handleFieldClick('removeAccount')}>
              <ListItemText
                classes={{
                  primary: classes.removeAccount,
                }}
                primary="Remove account from wallet"
              />
            </ListItem>
          </List>
        </div>
      </React.Fragment>
    );
  }
}

export default stylesDecorator(injectIntl(AccountSettings));
