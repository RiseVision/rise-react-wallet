import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { inject, observer } from 'mobx-react';
import { ChangeEvent, FormEvent } from 'react';
import * as React from 'react';
import WalletStore from '../../stores/wallet';
import { amountToUser } from '../../utils/utils';
import TransactionForm, {
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
  onSubmit: (result: boolean) => void;
}

export interface State {
  step: number;
  passphrase: string | null;
  mnemonic: string | null;
}

const stylesDecorator = withStyles(styles);

@inject('walletStore')
@observer
class SettingsPassphraseForm extends React.Component<Props, State> {
  state = {
    step: 1,
    passphrase: null,
    mnemonic: null
  };

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
    const account = walletStore.selectedAccount!;
    const fee = walletStore.fees.get('secondsignature')!;
    const isSet = account.secondSignature;
    // cancel if already set or not enought balance
    if (isSet || account.balance < fee) {
      this.props.onSubmit(false);
    } else {
      this.setState({ step: 2 });
    }
  }

  onSubmit2 = async (state: TransactionState) => {
    const mnemonic = state.mnemonic;
    const passphrase = state.passphrase;
    // TODO implement a loader
    // this.setState({
    //   isLoading: true
    // });
    await this.props.walletStore!.addPassphrase(mnemonic, passphrase);
    this.props.onSubmit(true);
  }

  render() {
    return this.state.step === 1 ? this.renderStep1() : this.renderStep2();
  }

  renderStep1() {
    const { classes, walletStore } = this.props;
    const account = walletStore!.selectedAccount!;
    const fee =
      walletStore!.fees.get('secondsignature')! + walletStore!.fees.get('send')!;
    const isSet = account.secondSignature;

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
    const account = walletStore.selectedAccount!;
    // TODO translate
    return (
      <TransactionForm
        onSubmit={this.onSubmit2}
        fee={
          walletStore.fees.get('secondsignature')! + walletStore.fees.get('send')!
        }
        amount={0}
        isPassphraseSet={account.secondSignature}
        sender={account.name}
        senderId={account.id}
        recipientId="transaction"
        recipient="2nd passphrase"
      />
    );
  }
}

export default stylesDecorator(SettingsPassphraseForm);
