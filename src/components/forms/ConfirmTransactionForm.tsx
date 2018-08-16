import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import DoneIcon from '@material-ui/icons/Done';
import * as classNames from 'classnames';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl,
} from 'react-intl';
import { amountToUser } from '../../utils/utils';
import AccountIcon from '../AccountIcon';

const styles = (theme: Theme) =>
  createStyles({
    viz: {
      display: 'flex',
      flexDirection: 'row',
    },
    vizArrow: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 2 * theme.spacing.unit,
      marginRight: 2 * theme.spacing.unit,
    },
    vizAmount: {
      paddingLeft: 16,
      paddingRight: 16,
      marginTop: '-1em',
    },
    arrow: {
      position: 'relative',
      height: 15,
      width: '100%',
      maxWidth: 120,
      '& > *': {
        borderColor: '#999',
      },
      '&$inactive > *': {
        borderColor: '#eee',
      },
    },
    inactive: {},
    arrowShaft: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 7,
      borderBottomWidth: 1,
      borderBottomStyle: 'solid',
      boxSizing: 'content-box',
    },
    arrowEnd: {
      position: 'absolute',
      top: 2,
      right: 0,
      width: 10,
      height: 10,
      borderTopWidth: 1,
      borderTopStyle: 'solid',
      borderRightWidth: 1,
      borderRightStyle: 'solid',
      transform: 'rotate(45deg)',
    },
    senderInfo: {
      textAlign: 'left',
    },
    recipientInfo: {
      textAlign: 'right',
    },
    accountAlias: {
      ...theme.typography.body2,
    },
    accountAddress: {
    },
    divider: {
      // Hack around the fact that the parent Dialog component
      // controls the content padding
      marginLeft: -2 * theme.spacing.unit,
      marginRight: -2 * theme.spacing.unit,
      // Adjust for the Grid margins
      marginTop: theme.spacing.unit,
      marginBottom: theme.spacing.unit,
    },
    txDetails: {
      textAlign: 'left',
    },
    txBreakdown: {
      textAlign: 'right',
      marginLeft: 'auto',
      // Display the cost breakdown as a table for easier visual digestion
      flex: 'none',
      display: 'table',
      '& > *': {
        display: 'table-row',
        '& > *': {
          display: 'table-cell',
          '&:first-child': {
            paddingRight: theme.spacing.unit,
          },
        },
      },
    },
    totalAmount: {
      fontWeight: 500,
    },
    statusContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 2 * theme.spacing.unit,
      marginRight: 2 * theme.spacing.unit,
      marginTop: theme.spacing.unit,
      marginBottom: theme.spacing.unit,
      '& > * + *': {
        marginLeft: 2 * theme.spacing.unit,
      },
    },
    statusIcon: {
      fontSize: 48,
    },
    statusMessage: {
      textAlign: 'left',
    },
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

function throwInvalidTxKind(tx: never): never;
function throwInvalidTxKind(tx: TxData) {
  throw new Error(`Invalid transaction kind ${tx.kind}`);
}

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

type DecoratedProps = Props & InjectedIntlProps;

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

const messages = defineMessages({
  unnamedSender: {
    id: 'forms-confirm-tx.unnamed-sender',
    description: 'Unnamed sender account',
    defaultMessage: 'Unnamed account',
  },
  unnamedRecipient: {
    id: 'forms-confirm-tx.unnamed-recipient',
    description: 'Unnamed recipient account',
    defaultMessage: 'Unknown recipient',
  },
  sendTxTitleAria: {
    id: 'forms-confirm-tx.send-title-aria',
    description: 'Send transaction title for accessibility',
    defaultMessage: 'Send transaction of {amount}',
  },
  passphraseTxTitleAria: {
    id: 'forms-confirm-tx.passphrase-title-aria',
    description: '2nd passphrase transaction title for accessibility',
    defaultMessage: 'Setup 2nd passphrase transaction',
  },
  delegateTxTitleAria: {
    id: 'forms-confirm-tx.delegate-title-aria',
    description: 'Register as delegate transaction title for accessibility',
    defaultMessage: 'Register as a delegate transaction',
  },
  voteTxTitleAria: {
    id: 'forms-confirm-tx.vote-title-aria',
    description: 'Vote transaction title for accessibility',
    defaultMessage: 'Vote transaction',
  },
  senderSummaryAria: {
    id: 'forms-confirm-tx.sender-summary-aria',
    description: 'Sender summary for accessibility',
    defaultMessage: 'From {account} ({address})',
  },
  recipientSummaryAria: {
    id: 'forms-confirm-tx.recipient-summary-aria',
    description: 'Recipient summary for accessibility',
    defaultMessage: 'To {account} ({address})',
  },
  txDetailsAria: {
    id: 'forms-confirm-tx.details-section-aria',
    description: 'Transaction details section title for accessibility',
    defaultMessage: 'Transaction details',
  },
  txBreakdownAria: {
    id: 'forms-confirm-tx.breakdown-section-aria',
    description: 'Transaction breakdown section title for accessibility',
    defaultMessage: 'Transaction cost breakdown',
  },
  errorIconAria: {
    id: 'forms-confirm-tx.error-icon-aria',
    description: 'Error status icon label for accessibility',
    defaultMessage: 'Error indicator icon',
  },
  successIconAria: {
    id: 'forms-confirm-tx.success-icon-aria',
    description: 'Success status icon label for accessibility',
    defaultMessage: 'Success indicator icon',
  },
});

@observer
class ConfirmTransactionForm extends React.Component<DecoratedProps, State> {
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
      intl,
      classes,
      isPassphraseSet,
      progress,
      senderId,
      fee,
      data,
      error,
      onClose,
    } = this.props;

    const total = fee + (data.kind === 'send' ? data.amount : 0);
    const recipientId = data.kind === 'send' ? data.recipientId : '';
    let sender = this.props.sender;
    if (!sender) {
      sender = intl.formatMessage(messages.unnamedSender);
    }
    let recipient = data.kind === 'send' ? data.recipient : null;
    if (!recipient) {
      recipient = intl.formatMessage(messages.unnamedRecipient);
    }

    const formatAmount = (amount: number) => (
      `${intl.formatNumber(amountToUser(amount))} RISE`
    );

    const renderDelegates = (usernames: string[]) => (
      <React.Fragment>
        {usernames
          .map(u => (<em key={u}>{u}</em>))
          .reduce(
            (a, u) => a.concat(a.length ? ', ' : null, u),
            [] as Array<null | string | JSX.Element>,
          )
        }
      </React.Fragment>
    );

    let txTitleAria = '';
    if (data.kind === 'send') {
      txTitleAria = intl.formatMessage(messages.sendTxTitleAria, {
        amount: formatAmount(data.amount),
      });
    } else if (data.kind === 'passphrase') {
      txTitleAria = intl.formatMessage(messages.passphraseTxTitleAria);
    } else if (data.kind === 'delegate') {
      txTitleAria = intl.formatMessage(messages.delegateTxTitleAria);
    } else if (data.kind === 'vote') {
      txTitleAria = intl.formatMessage(messages.voteTxTitleAria);
    } else {
      throwInvalidTxKind(data);
    }

    return (
      <form onSubmit={this.onSubmit}>
        <Grid container={true} spacing={16}>
          <Grid
            item={true}
            xs={12}
            className={classes.viz}
            aria-label={txTitleAria}
          >
            <AccountIcon size={64} address={senderId} />
            <div className={classes.vizArrow}>
              {data.kind === 'send' && (
                <Typography
                  className={classes.vizAmount}
                  aria-hidden={true}
                >
                  {formatAmount(data.amount)}
                </Typography>
              )}
              <div
                className={classNames(
                  classes.arrow,
                  data.kind !== 'send' && classes.inactive,
                )}
              >
                <div className={classes.arrowShaft} />
                <div className={classes.arrowEnd} />
              </div>
            </div>
            <AccountIcon size={64} address={recipientId} />
          </Grid>
          <Grid
            item={true}
            xs={12}
            sm={6}
            className={classes.senderInfo}
            aria-label={intl.formatMessage(messages.senderSummaryAria, {
              account: sender,
              address: senderId,
            })}
          >
            <Typography
              className={classes.accountAlias}
              aria-hidden={true}
            >
              {sender}
            </Typography>
            <Typography
              className={classes.accountAddress}
              aria-hidden={true}
            >
              {senderId}
            </Typography>
          </Grid>
          {data.kind === 'send' && (
            <Grid
              item={true}
              xs={12}
              sm={6}
              className={classes.recipientInfo}
              aria-label={intl.formatMessage(messages.recipientSummaryAria, {
                account: recipient,
                address: recipientId,
              })}
            >
              <Typography
                className={classes.accountAlias}
                aria-hidden={true}
              >
                {recipient}
              </Typography>
              <Typography
                className={classes.accountAddress}
                aria-hidden={true}
              >
                {recipientId}
              </Typography>
            </Grid>
          )}
        </Grid>
        {data.kind !== 'send' && (
          <React.Fragment>
            <Divider className={classes.divider} aria-hidden={true} />
            <Grid
              container={true}
              spacing={16}
              className={classes.txDetails}
              aria-label={intl.formatMessage(messages.txDetailsAria)}
            >
              <Grid item={true} xs={12}>
                {data.kind === 'passphrase' && (
                  <Typography>
                    <FormattedMessage
                      id="forms-confirm-tx.details-add-passphrase"
                      description="Transaction detail row for 2nd passphrase setup."
                      defaultMessage="Setup 2nd passphrase for account."
                    />
                  </Typography>
                )}
                {data.kind === 'delegate' && (
                  <Typography>
                    <FormattedMessage
                      id="forms-confirm-tx.details-register-delegate"
                      description="Transaction detail row for delegate registration."
                      defaultMessage="Register as a delegate with username {username}."
                      values={{
                        username: (<em>{data.username}</em>),
                      }}
                    />
                  </Typography>
                )}
                {data.kind === 'vote' && (
                  <React.Fragment>
                    {data.remove.length && (
                      <Typography>
                        <FormattedMessage
                          id="forms-confirm-tx.details-remove-votes"
                          description="Transaction detail row for vote removal."
                          defaultMessage={
                            'Remove {delegateCount, plural,' +
                            '  one {vote}' +
                            '  other {votes}' +
                            '} form {delegates}.'
                          }
                          values={{
                            delegateCount: data.add.length,
                            delegates: renderDelegates(data.remove),
                          }}
                        />
                      </Typography>
                    )}
                    {data.add.length && (
                      <Typography>
                        <FormattedMessage
                          id="forms-confirm-tx.details-add-votes"
                          description="Transaction detail row for vote addition."
                          defaultMessage={
                            'Cast {delegateCount, plural,' +
                            '  one {vote}' +
                            '  other {votes}' +
                            '} for {delegates}.'
                          }
                          values={{
                            delegateCount: data.add.length,
                            delegates: renderDelegates(data.add),
                          }}
                        />
                      </Typography>
                    )}
                  </React.Fragment>
                )}
              </Grid>
            </Grid>
          </React.Fragment>
        )}
        <Divider className={classes.divider} aria-hidden={true} />
        <Grid
          container={true}
          spacing={16}
        >
          <Grid
            item={true}
            xs={12}
            className={classes.txBreakdown}
            aria-label={intl.formatMessage(messages.txBreakdownAria)}
          >
            {data.kind === 'send' && (
              <Typography>
                <FormattedMessage
                  id="forms-confirm-tx.breakdown-amount-label"
                  description="Label for transfer amount in transaction breakdown."
                  defaultMessage="Transfer amount:"
                />
                {' '}
                <span>{formatAmount(data.amount)}</span>
              </Typography>
            )}
            <Typography>
              <FormattedMessage
                id="forms-confirm-tx.breakdown-fee-label"
                description="Label for network fee in transaction breakdown."
                defaultMessage="Network fee:"
              />
              {' '}
              <span>{formatAmount(fee)}</span>
            </Typography>
            <Typography>
              <FormattedMessage
                id="forms-confirm-tx.breakdown-total-label"
                description="Label for total cost in transaction breakdown."
                defaultMessage="Total:"
              />
              {' '}
              <span className={classes.totalAmount}>{formatAmount(total)}</span>
            </Typography>
          </Grid>
        </Grid>
        <Divider className={classes.divider} aria-hidden={true} />
        {progress === ProgressState.ERROR && (
          <Grid
            container={true}
            spacing={16}
          >
            <Grid
              item={true}
              xs={12}
              className={classes.statusContainer}
            >
              <ErrorOutlineIcon
                className={classes.statusIcon}
                color="error"
                aria-label={intl.formatMessage(messages.errorIconAria)}
              />
              <Typography className={classes.statusMessage}>
                <FormattedMessage
                  id="forms-confirm-tx.error-msg"
                  description="Message for when a transaction failed to broadcast."
                  defaultMessage={'Failed to broadcast the transaction to the network: {error}'}
                  values={{
                    error: error || 'N/A',
                  }}
                />
              </Typography>
            </Grid>
            <Grid
              item={true}
              xs={12}
              sm={6}
            >
              <Button type="submit" fullWidth={true}>
                <FormattedMessage
                  id="forms-confirm-tx.try-again-button"
                  description="Label for try again button."
                  defaultMessage="Try again"
                />
              </Button>
            </Grid>
            <Grid
              item={true}
              xs={12}
              sm={6}
            >
              <Button
                onClick={onClose}
                fullWidth={true}
              >
                <FormattedMessage
                  id="forms-confirm-tx.close-button"
                  description="Label for close button."
                  defaultMessage="Close"
                />
              </Button>
            </Grid>
          </Grid>
        )}
        {progress === ProgressState.SUCCESS && (
          <Grid
            container={true}
            spacing={16}
          >
            <Grid
              item={true}
              xs={12}
              className={classes.statusContainer}
            >
              <DoneIcon
                className={classes.statusIcon}
                color="secondary"
                aria-label={intl.formatMessage(messages.successIconAria)}
              />
              <Typography className={classes.statusMessage}>
                <FormattedMessage
                  id="forms-confirm-tx.success-msg"
                  description="Message for when a transaction broadcast succeeded."
                  defaultMessage="The transaction was successfully broadcast to the network!"
                />
              </Typography>
            </Grid>
            <Grid
              item={true}
              xs={12}
            >
              <Button
                type="submit"
                fullWidth={true}
              >
                <FormattedMessage
                  id="forms-confirm-tx.done-button"
                  description="Label for done button."
                  defaultMessage="Done"
                />
              </Button>
            </Grid>
          </Grid>
        )}
        {progress === ProgressState.IN_PROGRESS && (
          <Grid
            container={true}
            spacing={16}
          >
            <Grid
              item={true}
              xs={12}
              className={classes.statusContainer}
            >
              <CircularProgress color="secondary" />
              <Typography className={classes.statusMessage}>
                <FormattedMessage
                  id="forms-confirm-tx.broadcasting-msg"
                  description="Message for when a transaction is being broadcast."
                  defaultMessage="Broadcasting transaction to the network. Please wait..."
                />
              </Typography>
            </Grid>
          </Grid>
        )}
        {progress === ProgressState.TO_CONFIRM && (
          <Grid
            container={true}
            spacing={16}
          >
            <Grid item={true} xs={12}>
              <Typography>
                {isPassphraseSet ? (
                  <FormattedMessage
                    id="forms-confirm-tx.instructions-with-passphrase"
                    description="Instructions on how to confirm the transaction (with 2nd passphrase set)."
                    defaultMessage={
                      'To confirm this transaction, enter your mnemonic secret ' +
                      'and the 2nd passphrase into the text fields below.'
                    }
                  />
                ) : (
                  <FormattedMessage
                    id="forms-confirm-tx.instructions"
                    description="Instructions on how to confirm the transaction."
                    defaultMessage={
                      'To confirm this transaction, enter your mnemonic secret ' +
                      'into the text field below.'
                    }
                  />
                )}
              </Typography>
            </Grid>
            <Grid item={true} xs={12}>
              <TextField
                label={(
                  <FormattedMessage
                    id="forms-confirm-tx.mnemonic-input-label"
                    description="Label for mnemonic text field."
                    defaultMessage="Account mnemonic secret"
                  />
                )}
                value={this.state.mnemonic}
                onChange={this.handleChange('mnemonic')}
                autoFocus={true}
                fullWidth={true}
              />
            </Grid>
            {isPassphraseSet && (
              <Grid item={true} xs={12}>
                <TextField
                  label={(
                    <FormattedMessage
                      id="forms-confirm-tx.passphrase-input-label"
                      description="Label for 2nd passphrase text field."
                      defaultMessage="Second passphrase"
                    />
                  )}
                  value={this.state.passphrase}
                  onChange={this.handleChange('passphrase')}
                  fullWidth={true}
                />
              </Grid>
            )}
            <Grid item={true} xs={12}>
              <Button type="submit" fullWidth={true}>
                <FormattedMessage
                  id="forms-confirm-tx.sign-button"
                  description="Label for sign & broadcast button."
                  defaultMessage="Sign & broadcast"
                />
              </Button>
            </Grid>
          </Grid>
        )}
      </form>
    );
  }
}

export default stylesDecorator(injectIntl(ConfirmTransactionForm));
