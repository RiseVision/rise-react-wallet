import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
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

type SendTxData = {
  kind: 'send';
  recipientId: string;
  recipient: string | null;
  amount: number;
};

type PassphraseTxData = {
  kind: 'passphrase';
};

type DelegateTxData = {
  kind: 'delegate';
  username: string;
};

type VoteTxData = {
  kind: 'vote';
  remove: string[];
  add: string[];
};

type TxData =
  | SendTxData
  | PassphraseTxData
  | DelegateTxData
  | VoteTxData;

interface Props extends WithStyles<typeof styles> {
  onSend: (state: State) => void;
  onRedo: (state: State) => void;
  onClose: () => void;
  data: TxData;
  fee: number;
  sender: string | null;
  senderId: string;
  isPassphraseSet: boolean;
  // progress state
  progress: ProgressState;
  // states data
  error?: string;
}

export enum ProgressState {
  TO_CONFIRM,
  IN_PROGRESS,
  SUCCESS,
  ERROR
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
    if (this.props.progress === ProgressState.SUCCESS) {
      this.props.onClose();
    } else if (this.props.progress === ProgressState.ERROR) {
      this.props.onRedo({ ...this.state });
    } else {
      this.props.onSend({ ...this.state });
    }
  }

  render() {
    const {
      classes,
      isPassphraseSet,
      progress,
      sender,
      senderId,
      fee,
      data,
      error,
      onClose,
    } = this.props;

    let amount = fee;
    amount += data.kind === 'send' ? data.amount : 0;

    return (
      <form onSubmit={this.onSubmit} className={classes.form}>
        <div>
          FROM
          <Avatar className={classes.accountAvatar}>
            <AccountIcon size={24} address={senderId} />
          </Avatar>
          <p>{sender}</p>
          <p>{senderId}</p>
        </div>
        {data.kind === 'send' && (
          <div>
            TO
            <Avatar className={classes.accountAvatar}>
              <AccountIcon size={24} address={data.recipientId} />
            </Avatar>
            <p>{data.recipient}</p>
            <p>{data.recipientId}</p>
          </div>
        )}
        <div>
          <p>Network fee: {amountToUser(fee)} RISE</p>
          <p>Total: {amountToUser(amount)} RISE</p>
        </div>
        {/* TODO icons */}
        {progress === ProgressState.ERROR && (
          <React.Fragment>
            <Typography>
              Failed to broadcast the transaction to the network
              {error ? `: ${error}` : ''}.
            </Typography>
            <div className={classes.footer}>
              <Button
                name="close"
                onClick={onClose}
                fullWidth={true}
              >
                CLOSE
              </Button>
              <Button name="redo" type="submit" fullWidth={true}>
                TRY AGAIN
              </Button>
            </div>
          </React.Fragment>
        )}
        {/* TODO icons */}
        {progress === ProgressState.SUCCESS && (
          <React.Fragment>
            <Typography>
              The transaction was successfully broadcast to the network!
            </Typography>
            <div className={classes.footer}>
              <Button type="submit" fullWidth={true} name="close">
                DONE
              </Button>
            </div>
          </React.Fragment>
        )}
        {/* TODO loading spinner */}
        {progress === ProgressState.IN_PROGRESS && (
          <React.Fragment>
            <Typography>
              Broadcasting transaction to the network.<br />Please wait...
            </Typography>
          </React.Fragment>
        )}
        {progress === ProgressState.TO_CONFIRM && (
          <React.Fragment>
            <Typography>
              To confirm this transaction, enter your mnemonic secret
              {isPassphraseSet ? ' and the 2nd passphrase ' : ''} in
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
            {isPassphraseSet ? (
              <TextField
                className={classes.input}
                label="Second passphrase"
                onChange={this.handleChange('passphrase')}
                margin="normal"
                fullWidth={true}
              />
            ) : null}
            <div className={classes.footer}>
              <Button name="send" type="submit" fullWidth={true}>
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
