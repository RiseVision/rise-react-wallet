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
import {
  amountToUser,
  normalizeAddress,
  amountToServer
} from '../../utils/utils';

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
  onSubmit: (state: State) => void;
  amount: number;
  fee: number;
  balance: number;
  // pre-filled recipient
  recipientID?: string;
  // address book TODO type
  recipients?: { id: string; name: string }[];
}

export interface State {
  recipientID: string | null;
  amount: number | null;
}

const stylesDecorator = withStyles(styles);

// TODO address book
@observer
class SendTransactionForm extends React.Component<Props, State> {
  state: State = {
    recipientID: null,
    amount: null
  };

  constructor(props: Props) {
    super(props);
    this.state.recipientID = props.recipientID || null;
    this.state.amount = props.amount || null;
  }

  // TODO extract to Form
  handleChange = (field: string) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value;
    const fields = ['recipientID', 'amount'];
    if (fields.includes(field)) {
      // @ts-ignore TODO make it generic
      this.setState({
        [field]: value
      });
    }
  };

  onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!this.isValid()) {
      return;
    }
    this.props.onSubmit({ ...this.state });
  };

  isValid() {
    return this.isRecipientIDValid() && this.isAmountValid();
  }

  isAmountValid = () => {
    if (!this.state.amount) {
      return false;
    }
    const amount = amountToServer(this.state.amount);
    return amount > 0 && amount <= this.props.balance + this.props.fee;
  };

  isRecipientIDValid = () => {
    return Boolean(normalizeAddress(this.state.recipientID || ''));
  };

  render() {
    const { classes } = this.props;

    debugger;

    return (
      <form onSubmit={this.onSubmit} className={classes.form}>
        <Typography>
          Please enter the Recipient Address and RISE Amount that you would like
          send below.
        </Typography>
        <TextField
          className={classes.input}
          label="Recipient address"
          onChange={this.handleChange('recipientID')}
          margin="normal"
          fullWidth={true}
        />
        <TextField
          className={classes.input}
          label="RISE amount"
          onChange={this.handleChange('amount')}
          margin="normal"
          fullWidth={true}
        />
        {this.state.amount &&
          !this.isAmountValid() && (
            /* TODO translate */
            <Typography color="error">
              You don't have enough funds in your account. Transfer fee is{' '}
              {amountToUser(this.props.fee)}.
            </Typography>
          )}
        {this.state.recipientID &&
          !this.isRecipientIDValid() && (
            /* TODO translate */
            <Typography color="error">Recipient ID isnt valid.</Typography>
          )}
        <Typography>
          Balance: {amountToUser(this.props.balance)} | Fee:{' '}
          {amountToUser(this.props.fee)}
        </Typography>
        <div className={classes.footer}>
          <Button type="submit" fullWidth={true} disabled={!this.isValid()}>
            REVIEW & SEND
          </Button>
        </div>
      </form>
    );
  }
}

export default stylesDecorator(SendTransactionForm);
