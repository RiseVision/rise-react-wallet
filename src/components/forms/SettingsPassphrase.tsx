import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { DposAPI } from 'dpos-api-wrapper';
import { inject, observer } from 'mobx-react';
import { ChangeEvent, FormEvent } from 'react';
import * as React from 'react';
import UserStore from '../../stores/user';

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
  userStore?: UserStore;
  publicKey: string;
  onSubmit: (state: State) => void;
  balance: number;
}

export interface State {
  passphrase: string | null;
  mnemonic: string | null;
}

const stylesDecorator = withStyles(styles);

@inject('userStore')
@observer
class SettingsPassphraseForm extends React.Component<Props, State> {
  state = {
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
  };

  /**
   * Prevents event's default behavior synchronously and calls an async
   * function afterwards.
   */
  preventDefault = func => event => {
    event.preventDefault();
    return func();
  }

  onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const mnemonic = this.state.mnemonic;
    // TODO get from the TransactionForm
    const passphrase = this.state.passphrase;

    this.props.userStore!.addPassphrase(mnemonic, passphrase);
  };

  render() {
    const { classes } = this.props;

    return (
      <form onSubmit={this.preventDefault(this.onSubmit)} className={classes.form}>
        <Typography>
          The second passphrase offers an extra layer of protection for forgers
          whose primary mnemonic is stored on servers which can potentially get
          hacked and compromised the primary mnemonic.
        </Typography>
        <Typography>
          Once the 2nd passphrase has been set it cannot be changed nor removed.
        </Typography>
        {/* TODO node API */}
        {this.props.balance < 5 && (
          <Typography className={classes.error}>
            You don't have enough funds on your account to pay the network fee
            of 5 RISE to setup a 2nd passphrase!
          </Typography>
        )}
        {/* TODO node API */}
        {this.props.balance >= 5 && (
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
}

export default stylesDecorator(SettingsPassphraseForm);
