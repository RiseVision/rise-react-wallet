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
import {
  normalizeAddress,
  normalizeNumber,
  TAddressRecord,
  TAddressSource,
  formatAmount
} from '../../utils/utils';
import AddressSuggestionsMenu from '../../components/AddressSuggestionsMenu';
import { deburr, take } from 'lodash';
import {
  DialogContentProps,
  SetDialogContent,
  ICloseInterruptFormProps
} from '../Dialog';
import autoId from '../../utils/autoId';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2,
      textAlign: 'center'
    },
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

const stylesDecorator = withStyles(styles, { name: 'SendCoinsDialogContent' });

export interface SendFormState {
  recipientID: string;
  amount: RawAmount;
}

type BaseProps = WithStyles<typeof styles> & DialogContentProps;

interface Props extends BaseProps, ICloseInterruptFormProps {
  onSubmit: (state: SendFormState) => void;
  amount: RawAmount | null;
  sendFee: RawAmount;
  balance: RawAmount;
  // pre-filled recipient
  recipientID?: string;
  recipientName?: string;
  // all the contacts
  contacts: TAddressRecord[];
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  recipient: TAddressRecord;
  recipientInvalid: boolean;
  normalizedAddress: string;
  amount: string;
  amountInvalid: boolean;
  parsedAmount: RawAmount | null;
}

const messages = defineMessages({
  dialogTitle: {
    id: 'send-coins-dialog-content.dialog-title',
    description: 'Send coins dialog title',
    defaultMessage: 'Send RISE'
  },
  invalidAddress: {
    id: 'send-coins-dialog-content.invalid-address',
    description: 'Error label for invalid address text input',
    defaultMessage:
      'Invalid RISE address. A valid address is in the format of "1234567890R".'
  },
  invalidAmount: {
    id: 'send-coins-dialog-content.invalid-amount',
    description: 'Error label for invalid amount text input',
    defaultMessage: 'Invalid amount.'
  },
  insufficientBalance: {
    id: 'send-coins-dialog-content.insufficient-balance',
    description: 'Error label for too high amount text input',
    defaultMessage: 'This amount exceeds your account balance.'
  },
  recipientFromAddressBook: {
    id: 'send-coins-dialog-content.recipient-from-address-book',
    description: 'Info label for recipient field when filled via suggestions',
    defaultMessage: 'Address for {name} (from your address book)'
  },
  recipientFromWallet: {
    id: 'send-coins-dialog-content.recipient-from-wallet',
    description: 'Info label for recipient field when filled via suggestions',
    defaultMessage: 'Address for {name} (from your wallet)'
  },
  recipientIsDelegate: {
    id: 'send-coins-dialog-content.recipient-is-delegate',
    description: 'Info label for recipient field when filled via suggestions',
    defaultMessage: 'Address for {name} (a registered delegate)'
  }
});

class SendCoinsDialogContent extends React.Component<DecoratedProps, State> {
  @autoId dialogContentId: string;

  state: State = {
    recipient: {
      id: '',
      name: '',
      source: TAddressSource.INPUT
    },
    recipientInvalid: false,
    normalizedAddress: '',
    amount: '',
    amountInvalid: false,
    parsedAmount: null
  };

  constructor(props: DecoratedProps) {
    super(props);

    const { intl, recipientID, recipientName, amount } = this.props;

    if (recipientID) {
      this.state.recipient = {
        id: recipientID,
        name: recipientName || '',
        source: TAddressSource.PREFILLED
      };
      this.state.normalizedAddress = normalizeAddress(recipientID);
    }
    if (amount) {
      this.state.amount = formatAmount(intl, amount, false);
      this.state.parsedAmount = amount;
    }
  }

  handleRecipientStateChange = (
    options: StateChangeOptions<TAddressRecord>
  ) => {
    const { type, inputValue } = options;
    if (type === Downshift.stateChangeTypes.changeInput && inputValue) {
      // Handle user typing
      const normalizedAddress = normalizeAddress(inputValue.trim());

      this.setState({
        recipient: {
          id: inputValue,
          // TODO get the name from contacts
          name: '',
          source: TAddressSource.INPUT
        },
        recipientInvalid: false,
        normalizedAddress
      });
    } else if (type === Downshift.stateChangeTypes.blurInput) {
      // Handle user leaving the input
      const { id } = this.state.recipient;
      const recipientInvalid = !!id && !!this.recipientError();
      this.setState({ recipientInvalid });
    }
  }

  handleRecipientChange = (recipient: TAddressRecord) => {
    // Handle user selecting a suggestion
    const normalizedAddress = normalizeAddress(recipient.id.trim());

    this.setState({
      recipient,
      recipientInvalid: false,
      normalizedAddress
    });
    this.props.onFormChanged(
      this.formHasChanges(this.state.amount, recipient.name)
    );
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
      amountInvalid: normalizedAmount.length < 1,
      parsedAmount
    });
    this.props.onFormChanged(
      this.formHasChanges(amount, this.state.recipient.name)
    );
  }

  formHasChanges(amount: string, recipient: string): boolean {
    return Boolean(amount || recipient);
  }

  handleAmountBlur = () => {
    const amountInvalid = !!this.state.amount && !!this.amountError();
    const amount = this.state.parsedAmount
      ? this.state.parsedAmount.unit.toString()
      : '';
    this.setState({
      amountInvalid,
      amount
    });
  }

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
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
    const { intl, balance, sendFee } = this.props;
    const { parsedAmount } = this.state;

    if (parsedAmount === null || parsedAmount.lte(RawAmount.ZERO)) {
      return intl.formatMessage(messages.invalidAmount);
    } else if (parsedAmount.plus(sendFee).gt(balance)) {
      return intl.formatMessage(messages.insufficientBalance);
    } else {
      return null;
    }
  }

  recipientSummary(rec: TAddressRecord): string {
    const { intl } = this.props;
    const source = TAddressSource;

    switch (rec.source) {
      case source.ADDRESS_BOOK:
        return intl.formatMessage(messages.recipientFromAddressBook, {
          name: rec.name
        });
      case source.DELEGATE:
        return intl.formatMessage(messages.recipientIsDelegate, {
          name: rec.name
        });
      case source.WALLET:
        return intl.formatMessage(messages.recipientFromWallet, {
          name: rec.name
        });
      default:
        return '';
    }
  }

  /**
   * TODO move to an external component
   * @param query
   */
  getSuggestions(query: string): TAddressRecord[] {
    // For a valid address don't show suggestions
    const normalizedAddress = normalizeAddress(query.trim());
    if (normalizedAddress !== '') {
      return [];
    }

    // Run through a very simple scoring algorithm
    const queryPlain = deburr(query)
      .toLowerCase()
      .replace(/\s/giu, '');

    let suggestions = this.props.contacts;

    if (query.trim().length > 0) {
      let arr = suggestions
        .map(data => {
          const labelPlain = deburr(data.name)
            .toLowerCase()
            .replace(/\s/giu, '');

          let score = 0;
          if (data.id.startsWith(query)) {
            score += 2;
          }
          if (data.name.trim() === query) {
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

  componentWillMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
      contentId: this.dialogContentId
    });
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

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleFormSubmit}
      >
        <Grid item={true} xs={12}>
          <Typography id={this.dialogContentId}>
            <FormattedMessage
              id="send-coins-dialog-content.instructions"
              description="Instructions for Send RISE form"
              defaultMessage={
                'Please enter the recipient address and RISE amount that you ' +
                'wish to send below.'
              }
            />
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <Downshift
            itemToString={(rec: TAddressRecord) => rec.id}
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
                  autoFocus={true}
                  className={classes.recipientField}
                  label={
                    <FormattedMessage
                      id="send-coins-dialog-content.recipient-input-label"
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
                id="send-coins-dialog-content.amount-input-label"
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
              id="send-coins-dialog-content.balance-fee"
              description="Account balance & network fee label"
              defaultMessage="Balance: {balance} | Fee: {fee}"
              values={{
                balance: formatAmount(intl, this.props.balance),
                fee: formatAmount(intl, this.props.sendFee)
              }}
            />
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <Button type="submit" fullWidth={true}>
            <FormattedMessage
              id="send-coins-dialog-content.send-button"
              description="Send button label"
              defaultMessage="Review & send"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(SendCoinsDialogContent));
