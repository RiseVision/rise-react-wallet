import { runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import { ReactElement } from 'react';
import * as React from 'react';
import * as classNames from 'classnames';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import ArrowFwd from '@material-ui/icons/NavigateNext';
import { accountOverviewRoute, onboardingAddAccountRoute } from '../../routes';
import RootStore from '../../stores/root';
import WalletStore from '../../stores/wallet';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
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
      padding: theme.spacing.unit * 2,
      '& > button': {
        borderRadius: 0
      }
    },
    button: {
      width: '100%',
      textAlign: 'left',
      justifyContent: 'start',
      background: 'white',
      marginBottom: '1px',
      fontWeight: 'normal',
      textTransform: 'none',
      height: '3.5em'
    },
    subsectionTitle: {
      marginTop: theme.spacing.unit * 2,
      marginBottom: theme.spacing.unit,
      ['&:first-child']: {
        marginTop: 0
      }
    },
    remove: {
      '& span': {
        /* TODO take from the theme */
        color: 'red'
      }
    },
    buttonContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      display: 'flex',
      width: '100%',
      '& > span:nth-child(2)': {
        color: 'gray'
      }
    },
    arrow: {
      verticalAlign: 'middle',
      marginLeft: theme.spacing.unit * 2
    }
  });

interface Props extends WithStyles<typeof styles> {
  store?: RootStore;
  walletStore?: WalletStore;
}

interface State {
  dialogOpen: boolean;
  dialogField: string | null;
}

const stylesDecorator = withStyles(styles, { name: 'AccountOverview' });

@inject('store')
@inject('walletStore')
@observer
/**
 * TODO Translate
 */
class AccountSettings extends React.Component<Props, State> {
  state = {
    dialogOpen: false,
    dialogField: null
  };

  constructor(props: Props) {
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
    const { classes, walletStore } = this.props;
    const account = walletStore!.selectedAccount!;

    const dialog = this.getDialog();

    if (!account) {
      // TODO loading indicator
      return <div>Loading</div>;
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
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('name')}
            label="Account name"
            value={account.name || ''}
          />
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('pinned')}
            label="Pinned account"
            value={account.pinned ? 'Yes' : 'No'}
          />
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('delegate')}
            label="Voted delegate"
            value="TODO"
          />
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('fiat')}
            label="Displayed FIAT currency"
            value={account.fiatCurrency}
          />
          <Typography
            className={classes.subsectionTitle}
            variant="body2"
            color="textSecondary"
          >
            Advanced settings
          </Typography>
          {/* TODO check if already set */}
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('passphrase')}
            label="2nd passphrase"
            value={account.secondSignature ? 'Set' : 'Not set'}
          />
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('delegateRegistration')}
            label="Delegate registration"
            value="TODO Not registered"
          />
          <SettingRow
            classes={classes}
            onClick={() => this.handleFieldClick('removeAccount')}
            label="Remove account from wallet"
            value=""
            buttonClass={classes.remove}
          />
        </div>
      </React.Fragment>
    );
  }
}

function SettingRow({
  classes,
  label,
  value,
  buttonClass,
  onClick
}: {
  classes: Record<
    'button' | 'content' | 'remove' | 'buttonContent' | 'arrow',
    string
  >;
  label: string;
  value: string;
  buttonClass?: string;
  onClick(): void;
}) {
  return (
    <Button
      name="name"
      variant="contained"
      className={classNames(classes.button, buttonClass)}
      onClick={onClick}
    >
      <div className={classes.buttonContent}>
        <Typography component="span">{label}</Typography>
        <Typography component="span">
          {value}
          <ArrowFwd className={classes.arrow} />
        </Typography>
      </div>
    </Button>
  );
}

export default stylesDecorator(AccountSettings);
