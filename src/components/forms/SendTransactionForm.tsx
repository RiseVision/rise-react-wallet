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
import Downshift, { StateChangeOptions } from 'downshift';
import AccountIcon from '../../components/AccountIcon';
import { ChangeEvent, FormEvent } from 'react';
import { RawAmount } from '../../utils/amounts';
import { normalizeAddress, normalizeNumber } from '../../utils/utils';
import AddressSuggestionsMenu from '../../components/AddressSuggestionsMenu';
import { deburr, take } from 'lodash';

const styles = (theme: Theme) =>
  createStyles({
    accountContainer: {
      display: 'flex',
      alignItems: 'center',
      position: 'relative'
    },
    recipientField: {
      flex: 1
    },
    accountIcon: {
      marginLeft: 10
    }
  });

export interface SendFormState {
  recipientID: string;
  amount: RawAmount;
}

interface Props extends WithStyles<typeof styles> {
  onSubmit: (state: SendFormState) => void;
  amount: RawAmount | null;
  fee: RawAmount;
  balance: RawAmount;
  // pre-filled recipient
  recipientID?: string;
  // address book TODO type
  recipients?: { id: string; name: string }[];
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  recipient: AddressRecord;
  recipientInvalid: boolean;
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
    defaultMessage:
      'Invalid RISE address. A valid address is in the format of "1234567890R".'
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
  recipientFromAddressBook: {
    id: 'forms-send.recipient-from-address-book',
    description: 'Info label for recipient field when filled via suggestions',
    defaultMessage: 'Address for {name} (from your address book)'
  },
  recipientIsDelegate: {
    id: 'forms-send.recipient-is-delegate',
    description: 'Info label for recipient field when filled via suggestions',
    defaultMessage: 'Address for {name} (a registered delegate)'
  }
});

type AddressRecord = {
  address: string;
  label: string;
  source: 'user' | 'addressbook' | 'delegate';
};

// TODO: Replace fake dataset with actual data from address book
const fakeDataSet: AddressRecord[] = [
  {
    address: '10820014087913201714R',
    label: 'Beer frenzy',
    source: 'addressbook'
  },
  {
    address: '7851658041862611161R',
    label: 'Pretty gem',
    source: 'addressbook'
  },
  {
    address: '4551846025748003872R',
    label: 'Pink rose',
    source: 'addressbook'
  },
  { address: '8978172996617645434R', label: 'whiteknight', source: 'delegate' },
  {
    address: '6364858697947958466R',
    label: 'wakescpt2018',
    source: 'delegate'
  },
  {
    address: '18130374930582746781R',
    label: 'veke.ledger',
    source: 'delegate'
  },
  { address: '3858637968282355585R', label: 'corsaro', source: 'delegate' },
  {
    address: '13623845592771759209R',
    label: 'spookiestevie',
    source: 'delegate'
  },
  { address: '4982634728794354643R', label: 'hirish', source: 'delegate' },
  { address: '4551846025748003872R', label: 'doodoo', source: 'delegate' },
  { address: '6318860244441701655R', label: 'mcanever', source: 'delegate' },
  { address: '8466748795473371581R', label: 'ondin', source: 'delegate' }
];

@observer
class SendTransactionForm extends React.Component<DecoratedProps, State> {
  state: State = {
    recipient: {
      address: '',
      label: '',
      source: 'user'
    },
    recipientInvalid: false,
    normalizedAddress: '',
    amount: '',
    amountInvalid: false,
    parsedAmount: null
  };

  constructor(props: DecoratedProps) {
    super(props);

    const { intl, recipientID, amount } = this.props;

    if (recipientID) {
      this.state.recipient = {
        address: recipientID,
        label: '',
        source: 'user'
      };
      this.state.normalizedAddress = normalizeAddress(recipientID);
    }
    if (amount) {
      this.state.amount = intl.formatNumber(amount.unit.toNumber());
      this.state.parsedAmount = amount;
    }
  }

  handleRecipientStateChange = (options: StateChangeOptions<AddressRecord>) => {
    const { type, inputValue } = options;
    if (type === '__autocomplete_change_input__' && inputValue) {
      // Handle user typing
      const normalizedAddress = normalizeAddress(inputValue.trim());

      this.setState({
        recipient: {
          address: inputValue,
          label: '',
          source: 'user'
        },
        recipientInvalid: false,
        normalizedAddress
      });
    } else if (type === '__autocomplete_blur_input__') {
      // Handle user leaving the input
      const { address } = this.state.recipient;
      const recipientInvalid = !!address && !!this.recipientError();
      this.setState({ recipientInvalid });
    }
  }

  handleRecipientChange = (recipient: AddressRecord) => {
    // Handle user selecting a suggestion
    const normalizedAddress = normalizeAddress(recipient.address.trim());

    this.setState({
      recipient,
      recipientInvalid: false,
      normalizedAddress
    });
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
      parsedAmount
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

    const recipientInvalid = !!this.recipientError();
    const amountInvalid = !!this.amountError();
    if (recipientInvalid || amountInvalid) {
      this.setState({
        recipientInvalid,
        amountInvalid
      });
      return;
    }

    this.props.onSubmit({
      recipientID: normalizedAddress,
      amount: parsedAmount!
    });
  }

  recipientError(): string | null {
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

  recipientSummary(rec: AddressRecord): string {
    const { intl } = this.props;

    if (rec.source === 'addressbook') {
      return intl.formatMessage(messages.recipientFromAddressBook, {
        name: rec.label
      });
    } else if (rec.source === 'delegate') {
      return intl.formatMessage(messages.recipientIsDelegate, {
        name: rec.label
      });
    } else {
      return '';
    }
  }

  getSuggestions(query: string): AddressRecord[] {
    // For a valid address don't show suggestions
    const normalizedAddress = normalizeAddress(query.trim());
    if (normalizedAddress !== '') {
      return [];
    }

    // Run through a very simple scoring algorithm
    const queryPlain = deburr(query)
      .toLowerCase()
      .replace(/\s/giu, '');

    let suggestions = fakeDataSet;

    if (query.trim().length > 0) {
      let arr = suggestions
        .map(data => {
          const labelPlain = deburr(data.label)
            .toLowerCase()
            .replace(/\s/giu, '');

          let score = 0;
          if (data.address.startsWith(query)) {
            score += 2;
          }
          if (data.label.trim() === query) {
            score += 3;
          } else if (labelPlain.startsWith(queryPlain)) {
            score += 2;
          } else if (labelPlain.indexOf(queryPlain) >= 0) {
            score += 1;
          }

          return { data, score };
        })
        .filter(({ score }) => score > 0);

      // Sort in descending score order
      arr.sort((a, b) => b.score - a.score);

      suggestions = arr.map(({ data }) => data);
    }

    // Limit to 5 results per search
    return take(suggestions, 5);
  }

  render() {
    const { intl, classes } = this.props;
    const {
      recipient,
      recipientInvalid,
      normalizedAddress,
      amount,
      amountInvalid
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
          <Downshift
            itemToString={rec => rec.address}
            selectedItem={recipient}
            onStateChange={this.handleRecipientStateChange}
            onChange={this.handleRecipientChange}
          >
            {({
              getInputProps,
              getItemProps,
              isOpen,
              inputValue,
              highlightedIndex
            }) => (
              <div className={classes.accountContainer}>
                <TextField
                  className={classes.recipientField}
                  label={
                    <FormattedMessage
                      id="forms-send.recipient-input-label"
                      description="Label for recipient address text field."
                      defaultMessage="Recipient address"
                    />
                  }
                  InputProps={getInputProps()}
                  fullWidth={true}
                  error={recipientInvalid}
                  FormHelperTextProps={{
                    error: recipientInvalid
                  }}
                  helperText={
                    recipientInvalid
                      ? this.recipientError() || ''
                      : this.recipientSummary(recipient)
                  }
                />
                {isOpen && (
                  <AddressSuggestionsMenu
                    suggestions={this.getSuggestions(inputValue || '')}
                    highlightedIndex={highlightedIndex}
                    selectedItem={recipient}
                    getItemProps={getItemProps}
                  />
                )}
                <AccountIcon
                  className={classes.accountIcon}
                  size={48}
                  address={normalizedAddress}
                />
              </div>
            )}
          </Downshift>
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
              error: amountInvalid
            }}
            helperText={amountInvalid ? this.amountError() || '' : ''}
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
                fee: formatAmount(this.props.fee)
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
