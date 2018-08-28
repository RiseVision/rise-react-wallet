import Button from '@material-ui/core/Button';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { observer } from 'mobx-react';
import * as React from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import AccountIcon from '../../components/AccountIcon';
import { ChangeEvent, FormEvent } from 'react';
import { RawAmount } from '../../utils/amounts';
import {
  normalizeAddress,
  normalizeNumber,
} from '../../utils/utils';

const styles = (theme: Theme) => createStyles({
  accountContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  accountField: {
    flex: 1,
  },
  accountIcon: {
    marginLeft: 10,
  },
});

export interface SendFormState {
  recipientID: string;
  amount: RawAmount;
}

interface Props extends WithStyles<typeof styles> {
  onSubmit: (state: SendFormState) => void;
  amount: RawAmount;
  fee: RawAmount;
  balance: RawAmount;
  // pre-filled recipient
  recipientID?: string;
  // address book TODO type
  recipients?: { id: string; name: string }[];
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  address: string;
  addressInvalid: boolean;
  normalizedAddress: string;
  amount: string;
  amountInvalid: boolean;
  parsedAmount: RawAmount | null;
}

const stylesDecorator = withStyles(styles);

const messages = defineMessages({
  invalidAddress: {
    id: 'forms-send.invalid-address',
    description: 'Error label for invalid address text input',
    defaultMessage: 'Invalid RISE address. A valid address is in the format of "1234567890R".'
  },
  invalidAmount: {
    id: 'forms-send.invalid-amount',
    description: 'Error label for invalid amount text input',
    defaultMessage: 'Invalid amount.'
  },
  insufficientBalance: {
    id: 'forms-send.insufficient-balance',
    description: 'Error label for too high amount text input',
    defaultMessage: 'This amount exceeds your account balance.'
  },
});

// TODO address book
@observer
class SendTransactionForm extends React.Component<DecoratedProps, State> {
  state: State = {
    address: '',
    addressInvalid: false,
    normalizedAddress: '',
    amount: '',
    amountInvalid: false,
    parsedAmount: null,
  };

  constructor(props: DecoratedProps) {
    super(props);

    const { intl, recipientID, amount } = this.props;

    if (recipientID) {
      this.state.address = recipientID;
      this.state.normalizedAddress = normalizeAddress(recipientID);
    }
    if (amount) {
      this.state.amount = intl.formatNumber(amount.unit.toNumber());
      this.state.parsedAmount = amount;
    }
  }

  handleAddressChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const address = ev.target.value;
    const normalizedAddress = normalizeAddress(address.trim());

    this.setState({
      address,
      addressInvalid: false,
      normalizedAddress,
    });
  }

  handleAddressBlur = () => {
    const { address } = this.state;
    const addressInvalid = !!address && !!this.addressError();
    this.setState({ addressInvalid });
  }

  handleAmountChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const { intl } = this.props;
    const amount = ev.target.value;
    const normalizedAmount = normalizeNumber(intl, amount.trim());

    let parsedAmount = null;
    if (normalizedAmount) {
      parsedAmount = RawAmount.fromUnit(normalizedAmount);
    }

    this.setState({
      amount,
      amountInvalid: false,
      parsedAmount,
    });
  }

  handleAmountBlur = () => {
    const { amount } = this.state;
    const amountInvalid = !!amount && !!this.amountError();
    this.setState({ amountInvalid });
  }

  handleSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { normalizedAddress, parsedAmount } = this.state;

    const addressInvalid = !!this.addressError();
    const amountInvalid = !!this.amountError();
    if (addressInvalid || amountInvalid) {
      this.setState({
        addressInvalid,
        amountInvalid,
      });
      return;
    }

    this.props.onSubmit({
      recipientID: normalizedAddress,
      amount: parsedAmount!,
    });
  }

  addressError(): string | null {
    const { intl } = this.props;
    const { normalizedAddress } = this.state;

    if (normalizedAddress === '') {
      return intl.formatMessage(messages.invalidAddress);
    } else {
      return null;
    }
  }

  amountError(): string | null {
    const { intl, balance, fee } = this.props;
    const { parsedAmount } = this.state;

    if (parsedAmount === null || parsedAmount.lte(RawAmount.ZERO)) {
      return intl.formatMessage(messages.invalidAmount);
    } else if (parsedAmount.plus(fee).gt(balance)) {
      return intl.formatMessage(messages.insufficientBalance);
    } else {
      return null;
    }
  }

  render() {
    const { intl, classes } = this.props;
    const {
      address,
      addressInvalid,
      normalizedAddress,
      amount,
      amountInvalid,
    } = this.state;

    const formatAmount = (value: RawAmount) =>
      `${intl.formatNumber(value.unit.toNumber())} RISE`;

    return (
      <Grid
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleSubmit}
      >
        <Grid item={true} xs={12}>
          <Typography>
            <FormattedMessage
              id="forms-send.instructions"
              description="Insturctions for send RISE form"
              defaultMessage={
                'Please enter the recipient address and RISE amount that you ' +
                'wish to send below.'
              }
            />
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <div className={classes.accountContainer}>
            <TextField
              className={classes.accountField}
              label={
                <FormattedMessage
                  id="forms-send.recipient-input-label"
                  description="Label for recipient address text field."
                  defaultMessage="Recipient address"
                />
              }
              value={address}
              fullWidth={true}
              error={addressInvalid}
              FormHelperTextProps={{
                error: addressInvalid,
              }}
              helperText={addressInvalid ? (this.addressError() || '') : ''}
              onChange={this.handleAddressChange}
              onBlur={this.handleAddressBlur}
            />
            <AccountIcon
              className={classes.accountIcon}
              size={48}
              address={normalizedAddress}
            />
          </div>
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            label={
              <FormattedMessage
                id="forms-send.amount-input-label"
                description="Label for amount text field."
                defaultMessage="RISE amount"
              />
            }
            value={amount}
            fullWidth={true}
            error={amountInvalid}
            FormHelperTextProps={{
              error: amountInvalid,
            }}
            helperText={amountInvalid ? (this.amountError() || '') : ''}
            onChange={this.handleAmountChange}
            onBlur={this.handleAmountBlur}
          />
        </Grid>
        <Grid item={true} xs={12}>
          <Typography>
            <FormattedMessage
              id="forms-send.balance-fee"
              description="Account balance & network fee label"
              defaultMessage="Balance: {balance} | Fee: {fee}"
              values={{
                balance: formatAmount(this.props.balance),
                fee: formatAmount(this.props.fee),
              }}
            />
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <Button type="submit" fullWidth={true}>
            <FormattedMessage
              id="forms-send.send-button"
              description="Send button label"
              defaultMessage="Review & send"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(SendTransactionForm));
