import Avatar from '@material-ui/core/Avatar';
import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { observer } from 'mobx-react';
import { ChangeEvent, FormEvent } from 'react';
import * as React from 'react';
import { amountToUser } from '../../utils/utils';
import AccountIcon from '../AccountIcon';

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
    },
    accountAvatar: {
      backgroundColor: 'white'
    }
  });

interface Props extends WithStyles<typeof styles> {
  onSubmit: (state: State) => void;
  amount: number;
  fee: number;
  sender: string | null;
  senderId: string;
  recipient: string;
  // no recipientId means internal operation (eg second signature)
  recipientId?: string;
  isPassphraseSet: boolean;
  // progress states
  isSuccessfull?: boolean;
  isError?: boolean;
  isInProgress?: boolean;
  // states data
  error?: string;
}

export interface State {
  passphrase: string;
  mnemonic: string;
}

const stylesDecorator = withStyles(styles);

@observer
class ConfirmTransactionForm extends React.Component<Props, State> {
  state = {
    passphrase: '',
    mnemonic: ''
  };

  // TODO extract to Form
  handleChange = (field: string) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    const fields = ['passphrase', 'mnemonic'];
    if (fields.includes(field)) {
      // @ts-ignore TODO make it generic
      this.setState({
        [field]: value
      });
    }
  }

  onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    this.props.onSubmit({ ...this.state });
  }

  render() {
    const { classes, isInProgress, isSuccessfull, isError } = this.props;
    const isToConfirm = !isSuccessfull && !isError && !isInProgress;

    return (
      <form onSubmit={this.onSubmit} className={classes.form}>
        <div>
          FROM
          <Avatar className={classes.accountAvatar}>
            <AccountIcon size={24} address={this.props.senderId} />
          </Avatar>
          <p>{this.props.sender}</p>
          <p>{this.props.senderId}</p>
        </div>
        <div>
          TO
          {this.props.recipientId && (
            <Avatar className={classes.accountAvatar}>
              <AccountIcon size={24} address={this.props.recipientId} />
            </Avatar>
          )}
          <p>{this.props.recipient}</p>
          <p>{this.props.recipientId}</p>
        </div>
        <div>
          <p>Network fee: {amountToUser(this.props.fee)} RISE</p>
          <p>Total: {amountToUser(this.props.amount + this.props.fee)} RISE</p>
        </div>
        {/* TODO icons */}
        {isSuccessfull && (
          <React.Fragment>
            <Typography>
              Failed to broadcast the transaction to the network:{' '}
              {this.props.error || ''}.
            </Typography>
            <div className={classes.footer}>
              <Button id="close" type="submit" fullWidth={true}>
                CLOSE
              </Button>
              <Button id="redo" type="submit" fullWidth={true}>
                TRY AGAIN
              </Button>
            </div>
          </React.Fragment>
        )}
        {/* TODO icons */}
        {isError && (
          <React.Fragment>
            <Typography>
              The transaction was succesfully broadcast to the network!
            </Typography>
            <div className={classes.footer}>
              <Button type="submit" fullWidth={true}>
                DONE
              </Button>
            </div>
          </React.Fragment>
        )}
        {/* TODO loading spinner */}
        {isInProgress && (
          <React.Fragment>
            <Typography>
              Broadcasting transaction to the network.<br />Please wait...
            </Typography>
          </React.Fragment>
        )}
        {isToConfirm && (
          <React.Fragment>
            <Typography>
              To confirm this transaction, enter your mnemonic secret
              {this.props.isPassphraseSet ? ' and the 2nd passphrase ' : ''} in
              the input boxes below.
            </Typography>
            <TextField
              className={classes.input}
              label="Account mnemonic secret"
              onChange={this.handleChange('mnemonic')}
              margin="normal"
              autoFocus={true}
              fullWidth={true}
            />
            {this.props.isPassphraseSet ? (
              <TextField
                className={classes.input}
                label="Second passphrase"
                onChange={this.handleChange('passphrase')}
                margin="normal"
                fullWidth={true}
              />
            ) : null}
            <div className={classes.footer}>
              <Button type="submit" fullWidth={true}>
                SIGN &amp; BROADCAST
              </Button>
            </div>
          </React.Fragment>
        )}
      </form>
    );
  }
}

export default stylesDecorator(ConfirmTransactionForm);
