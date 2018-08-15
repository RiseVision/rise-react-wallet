import Button from '@material-ui/core/Button';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { accountOverviewRoute } from '../../routes';
import RootStore from '../../stores/root';
import WalletStore, { TTransactionResult } from '../../stores/wallet';
import { amountToUser } from '../../utils/utils';
import TransactionForm, {
  ProgressState,
  State as TransactionState
} from './ConfirmTransactionForm';

const styles = (theme: Theme) =>
  createStyles({
    input: {
      color: theme.palette.grey['600']
    },
    footer: {
      marginTop: theme.spacing.unit,
      '& button': {
        color: theme.palette.grey['600']
      }
    },
    error: {
      /* TODO from the theme */
      color: 'red'
    },
    form: {
      '& > p + p': {
        marginTop: theme.spacing.unit
      }
    }
  });

interface Props extends WithStyles<typeof styles> {
  walletStore?: WalletStore;
  store?: RootStore;
  onSubmit?: (tx?: TTransactionResult) => void;
}

export interface State {
  step: number;
  passphrase: string | null;
  tx?: TTransactionResult;
  // progress state
  progress: ProgressState;
  // states data
  error?: string;
}

const stylesDecorator = withStyles(styles);

@inject('walletStore')
// TODO inject router only
@inject('store')
@observer
class SettingsPassphraseForm extends React.Component<Props, State> {
  state: State = {
    step: 1,
    passphrase: null,
    progress: ProgressState.TO_CONFIRM
  };

  // TODO get account()

  // TODO extract to Form
  handleChange = (field: string) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    if (field === 'passphrase') {
      this.setState({
        [field]: value
      });
    }
  }

  onSubmit1 = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const walletStore = this.props.walletStore!;
    const account = walletStore.selectedAccount;
    const fee = walletStore.fees.get('secondsignature')!;
    const isSet = account.secondSignature;
    // cancel if already set or not enought balance
    if (isSet || account.balance < fee) {
      this.onClose();
    } else {
      this.setState({ step: 2 });
    }
  }

  onSend = async (state: TransactionState) => {
    // set in-progress
    this.setState({ progress: ProgressState.IN_PROGRESS });
    let tx: TTransactionResult;
    try {
      // TODO error msg
      tx = await this.props.walletStore!.addPassphrase(
        state.mnemonic,
        state.passphrase
      );
    } catch (e) {
      tx = { success: false };
    }
    const progress = tx.success ? ProgressState.SUCCESS : ProgressState.ERROR;
    this.setState({ tx, progress });
  }

  onClose = () => {
    if (this.props.onSubmit) {
      this.props.onSubmit(this.state.tx);
    } else {
      // fallback
      this.props.store!.router.goTo(accountOverviewRoute);
    }
  }

  render() {
    return this.state.step === 1 ? this.renderStep1() : this.renderStep2();
  }

  renderStep1() {
    const { classes, walletStore } = this.props;
    const account = walletStore!.selectedAccount;
    const fee =
      walletStore!.fees.get('secondsignature')! +
      walletStore!.fees.get('send')!;
    const isSet = account.secondSignature;

    // TODO extract the form markup to a separate file
    return (
      <form onSubmit={this.onSubmit1} className={classes.form}>
        <Typography>
          The second passphrase offers an extra layer of protection for forgers
          whose primary mnemonic is stored on servers which can potentially get
          hacked and compromised the primary mnemonic.
        </Typography>
        <Typography>
          Once the 2nd passphrase has been set it cannot be changed nor removed.
        </Typography>
        {isSet && (
          <Typography className={classes.error}>
            You've already set the 2nd passphrase, it can't be changed. Transfer
            you funds to a new address to set a new 2nd passphrase.
          </Typography>
        )}
        {!isSet &&
          account.balance < fee && (
            <Typography className={classes.error}>
              You don't have enough funds on your account to pay the network fee
              of {amountToUser(fee)} RISE to setup a 2nd passphrase!
            </Typography>
          )}
        {!isSet &&
          account.balance >= fee && (
            <TextField
              className={classes.input}
              label="2nd passphrase"
              onChange={this.handleChange('passphrase')}
              margin="normal"
              autoFocus={true}
              fullWidth={true}
            />
          )}
        <div className={classes.footer}>
          <Button type="submit" fullWidth={true}>
            CONTINUE
          </Button>
        </div>
      </form>
    );
  }

  renderStep2() {
    const walletStore = this.props.walletStore!;
    const account = walletStore.selectedAccount;
    return (
      <TransactionForm
        onSend={this.onSend}
        onRedo={this.onSend}
        onClose={this.onClose}
        progress={this.state.progress}
        fee={walletStore.fees.get('secondsignature')!}
        data={{
          kind: 'passphrase',
        }}
        isPassphraseSet={account.secondSignature}
        sender={account.name}
        senderId={account.id}
      />
    );
  }
}

export default stylesDecorator(SettingsPassphraseForm);
