import Backdrop from '@material-ui/core/Backdrop';
import Button from '@material-ui/core/Button';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import DoneIcon from '@material-ui/icons/Done';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import * as classNames from 'classnames';
import * as React from 'react';
import { ChangeEvent, FormEvent } from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import { LiskWallet } from 'dpos-offline';
import ModalPaper from '../ModalPaper';
import ModalPaperHeader from '../ModalPaperHeader';
import autoId from '../../utils/autoId';
import { RawAmount } from '../../utils/amounts';
import AccountIcon from '../AccountIcon';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2,
      textAlign: 'center'
    },
    viz: {
      display: 'flex',
      flexDirection: 'row'
    },
    vizArrow: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 2 * theme.spacing.unit,
      marginRight: 2 * theme.spacing.unit
    },
    vizAmount: {
      paddingLeft: 16,
      paddingRight: 16,
      marginTop: '-1em'
    },
    arrow: {
      position: 'relative',
      height: 15,
      width: '100%',
      maxWidth: 120,
      '& > *': {
        borderColor: '#999'
      },
      '&$inactive > *': {
        borderColor: '#eee'
      }
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
      boxSizing: 'content-box'
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
      transform: 'rotate(45deg)'
    },
    senderInfo: {
      textAlign: 'left'
    },
    recipientInfo: {
      textAlign: 'right'
    },
    accountAlias: {
      ...theme.typography.body2
    },
    accountAddress: {},
    txDetails: {
      textAlign: 'left'
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
            paddingRight: theme.spacing.unit
          }
        }
      }
    },
    totalAmount: {
      fontWeight: 500
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
        marginLeft: 2 * theme.spacing.unit
      }
    },
    statusIcon: {
      fontSize: 48
    },
    statusMessage: {
      textAlign: 'left'
    }
  });

const stylesDecorator = withStyles(styles);

const messages = defineMessages({
  dialogTitle: {
    id: 'confirm-tx-dialog.dialog-title',
    description: 'Confirm transaction dialog title',
    defaultMessage: 'Confirm transaction'
  },
  unnamedSender: {
    id: 'forms-confirm-tx.unnamed-sender',
    description: 'Unnamed sender account',
    defaultMessage: 'Unnamed account'
  },
  unnamedRecipient: {
    id: 'forms-confirm-tx.unnamed-recipient',
    description: 'Unnamed recipient account',
    defaultMessage: 'Unknown recipient'
  },
  sendTxTitleAria: {
    id: 'forms-confirm-tx.send-title-aria',
    description: 'Send transaction title for accessibility',
    defaultMessage: 'Send transaction of {amount}'
  },
  passphraseTxTitleAria: {
    id: 'forms-confirm-tx.passphrase-title-aria',
    description: '2nd passphrase transaction title for accessibility',
    defaultMessage: 'Setup 2nd passphrase transaction'
  },
  delegateTxTitleAria: {
    id: 'forms-confirm-tx.delegate-title-aria',
    description: 'Register as delegate transaction title for accessibility',
    defaultMessage: 'Register as a delegate transaction'
  },
  voteTxTitleAria: {
    id: 'forms-confirm-tx.vote-title-aria',
    description: 'Vote transaction title for accessibility',
    defaultMessage: 'Vote transaction'
  },
  senderSummaryAria: {
    id: 'forms-confirm-tx.sender-summary-aria',
    description: 'Sender summary for accessibility',
    defaultMessage: 'From {account} ({address})'
  },
  recipientSummaryAria: {
    id: 'forms-confirm-tx.recipient-summary-aria',
    description: 'Recipient summary for accessibility',
    defaultMessage: 'To {account} ({address})'
  },
  txDetailsAria: {
    id: 'forms-confirm-tx.details-section-aria',
    description: 'Transaction details section title for accessibility',
    defaultMessage: 'Transaction details'
  },
  txBreakdownAria: {
    id: 'forms-confirm-tx.breakdown-section-aria',
    description: 'Transaction breakdown section title for accessibility',
    defaultMessage: 'Transaction cost breakdown'
  },
  errorIconAria: {
    id: 'forms-confirm-tx.error-icon-aria',
    description: 'Error status icon label for accessibility',
    defaultMessage: 'Error indicator icon'
  },
  successIconAria: {
    id: 'forms-confirm-tx.success-icon-aria',
    description: 'Success status icon label for accessibility',
    defaultMessage: 'Success indicator icon'
  },
  invalidMnemonicMissing: {
    id: 'forms-register-delegate.invalid-mnemonic-missing',
    description: 'Error label for an invalid mnemonic (missing)',
    defaultMessage: 'Missing secret. Please enter the mnemonic secret for your account.',
  },
  invalidMnemonicIncorrect: {
    id: 'forms-register-delegate.invalid-mnemonic-incorrect',
    description: 'Error label for an invalid mnemonic',
    defaultMessage: 'Incorrect secret. The secret you entered is not associated with this account.'
  },
  invalidMnemonicNoWords: {
    id: 'forms-register-delegate.invalid-mnemonic-no-words',
    description: 'Error label for an invalid mnemonic (no words)',
    defaultMessage: 'Incorrect secret. The mnemonic usually consists of 12 words separated with spaces.'
  },
  invalidPassphraseMissing: {
    id: 'forms-register-delegate.invalid-passphrase-missing',
    description: 'Error label for an invalid passphrase',
    defaultMessage: 'Missing passphrase. Please enter the passphrase for your account.'
  },
  invalidPassphraseIncorrect: {
    id: 'forms-register-delegate.invalid-passphrase-incorrect',
    description: 'Error label for an invalid passphrase',
    defaultMessage: 'Incorrect passphrase. The passphrase you entered is not associated with this account.'
  }
});

type SendTxData = {
  kind: 'send';
  recipientId: string;
  recipient: string | null;
  amount: RawAmount;
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

type TxData = SendTxData | PassphraseTxData | DelegateTxData | VoteTxData;

function throwInvalidTxKind(tx: never): never;
function throwInvalidTxKind(tx: TxData) {
  throw new Error(`Invalid transaction kind ${tx.kind}`);
}

type ConfirmStep = {
  kind: 'confirm';
  publicKey: string;
  secondPublicKey: string | null;
  onSend: (data: { mnemonic: string; passphrase: null | string }) => void;
};

type InProgressStep = {
  kind: 'in-progress';
};

type SuccessStep = {
  kind: 'success';
};

type FailureStep = {
  kind: 'failure';
  onRetry?: () => void;
  reason: string;
};

type Step =
  | ConfirmStep
  | InProgressStep
  | SuccessStep
  | FailureStep;

interface Props extends WithStyles<typeof styles> {
  open: boolean;
  onBackClick?: () => void;
  onCloseClick?: () => void;
  data: TxData;
  fee: RawAmount;
  sender: string | null;
  senderId: string;
  step: Step;
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  mnemonic: string;
  mnemonicInvalid: boolean;
  passphrase: string;
  passphraseInvalid: boolean;
}

class ConfirmTransactionDialog extends React.Component<DecoratedProps, State> {
  @autoId dialogTitleId: string;

  state = {
    mnemonic: '',
    mnemonicInvalid: false,
    passphrase: '',
    passphraseInvalid: false,
  };

  handleMnemonicChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const mnemonic = ev.target.value;
    this.setState({ mnemonic });
  }

  handleMnemonicBlur = () => {
    const { mnemonic } = this.state;
    const mnemonicInvalid = !!mnemonic && !!this.mnemonicError();
    this.setState({ mnemonicInvalid });
  }

  handlePassphraseChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const passphrase = ev.target.value;
    this.setState({ passphrase });
  }

  handlePassphraseBlur = () => {
    const { passphrase } = this.state;
    const passphraseInvalid = !!passphrase && !!this.passphraseError();
    this.setState({ passphraseInvalid });
  }

  handleFormSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const { step } = this.props;

    if (step.kind === 'confirm') {
      const mnemonicInvalid = !!this.mnemonicError();
      const passphraseInvalid = !step.secondPublicKey || !!this.passphraseError();

      if (mnemonicInvalid || passphraseInvalid) {
        this.setState({
          mnemonicInvalid,
          passphraseInvalid,
        });
        return;
      }

      const { mnemonic, passphrase } = this.state;
      step.onSend({
        mnemonic,
        passphrase: step.secondPublicKey ? passphrase : null,
      });
    }
  }

  mnemonicError(): string | null {
    const { intl, step } = this.props;
    const { mnemonic } = this.state;

    let publicKey = '';
    if (step.kind === 'confirm') {
      publicKey = step.publicKey;
    }

    if (!mnemonic.trim()) {
      return intl.formatMessage(messages.invalidMnemonicMissing);
    }

    // The derivation takes some CPU cycles, so only do it after the empty check
    const isValid = derivePublicKey(mnemonic) === publicKey;

    if (isValid) {
      return null;
    } else if (mnemonic.indexOf(' ') < 0) {
      return intl.formatMessage(messages.invalidMnemonicNoWords);
    } else {
      return intl.formatMessage(messages.invalidMnemonicIncorrect);
    }
  }

  passphraseError(): string | null {
    const { intl, step } = this.props;
    const { passphrase } = this.state;

    let publicKey = '';
    if (step.kind === 'confirm') {
      publicKey = step.secondPublicKey || '';
    }

    if (!passphrase.trim()) {
      return intl.formatMessage(messages.invalidPassphraseMissing);
    }

    // The derivation takes some CPU cycles, so only do it after the empty check
    const isValid = derivePublicKey(passphrase) === publicKey;

    if (isValid) {
      return null;
    } else {
      return intl.formatMessage(messages.invalidPassphraseIncorrect);
    }
  }

  render() {
    const {
      intl,
      classes,
      open,
      onBackClick,
      onCloseClick,
      data,
      fee,
      senderId,
      step
    } = this.props;

    // TODO extract
    const formatAmount = (amount: RawAmount) =>
      `${intl.formatNumber(amount.unit.toNumber())} RISE`;

    const total = fee.plus(data.kind === 'send' ? data.amount : RawAmount.ZERO);
    const recipientId = data.kind === 'send' ? data.recipientId : '';
    let sender = this.props.sender;
    if (!sender) {
      sender = intl.formatMessage(messages.unnamedSender);
    }
    let recipient = data.kind === 'send' ? data.recipient : null;
    if (!recipient) {
      recipient = intl.formatMessage(messages.unnamedRecipient);
    }

    let txTitleAria = '';
    if (data.kind === 'send') {
      txTitleAria = intl.formatMessage(messages.sendTxTitleAria, {
        amount: formatAmount(data.amount)
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
      <ModalPaper
        open={open}
        backdrop={Backdrop}
        aria-labelledby={this.dialogTitleId}
        onEscapeKeyDown={onCloseClick}
      >
        <ModalPaperHeader
          titleId={this.dialogTitleId}
          closeButton={!!onCloseClick}
          onCloseClick={onCloseClick}
          backButton={!!onBackClick}
          onBackClick={onBackClick}
          children={intl.formatMessage(messages.dialogTitle)}
        />
        <Grid
          className={classes.content}
          container={true}
          spacing={16}
        >
          <Grid
            item={true}
            xs={12}
            className={classes.viz}
            aria-label={txTitleAria}
          >
            <AccountIcon size={64} address={senderId} />
            <div className={classes.vizArrow}>
              {data.kind === 'send' && (
                <Typography className={classes.vizAmount} aria-hidden={true}>
                  {formatAmount(data.amount)}
                </Typography>
              )}
              <div
                className={classNames(
                  classes.arrow,
                  data.kind !== 'send' && classes.inactive
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
              address: senderId
            })}
          >
            <Typography
              className={classes.accountAlias}
              aria-hidden={true}
              children={sender}
            />
            <Typography
              className={classes.accountAddress}
              aria-hidden={true}
              children={senderId}
            />
          </Grid>
          {data.kind === 'send' && (
            <Grid
              item={true}
              xs={12}
              sm={6}
              className={classes.recipientInfo}
              aria-label={intl.formatMessage(messages.recipientSummaryAria, {
                account: recipient,
                address: recipientId
              })}
            >
              <Typography
                className={classes.accountAlias}
                aria-hidden={true}
                children={recipient}
              />
              <Typography
                className={classes.accountAddress}
                aria-hidden={true}
                children={recipientId}
              />
            </Grid>
          )}
        </Grid>
        {data.kind !== 'send' && (
          <React.Fragment>
            <Divider aria-hidden={true} />
            <Grid
              className={classNames(
                classes.content,
                classes.txDetails,
              )}
              container={true}
              spacing={16}
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
                        username: <em>{data.username}</em>
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
                            delegates: emphasizeAndJoin(data.remove)
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
                            delegates: emphasizeAndJoin(data.add)
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
        <Divider aria-hidden={true} />
        <Grid container={true} spacing={16}>
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
                />{' '}
                <span>{formatAmount(data.amount)}</span>
              </Typography>
            )}
            <Typography>
              <FormattedMessage
                id="forms-confirm-tx.breakdown-fee-label"
                description="Label for network fee in transaction breakdown."
                defaultMessage="Network fee:"
              />{' '}
              <span>{formatAmount(fee)}</span>
            </Typography>
            <Typography>
              <FormattedMessage
                id="forms-confirm-tx.breakdown-total-label"
                description="Label for total cost in transaction breakdown."
                defaultMessage="Total:"
              />{' '}
              <span className={classes.totalAmount}>{formatAmount(total)}</span>
            </Typography>
          </Grid>
        </Grid>
        <Divider aria-hidden={true} />
        {step.kind === 'failure' && this.renderFailureFooter(step)}
        {step.kind === 'success' && this.renderSuccessFooter(step)}
        {step.kind === 'in-progress' && this.renderInProgressFooter(step)}
        {step.kind === 'confirm' && this.renderConfirmFooter(step)}
      </ModalPaper>
    );
  }

  renderConfirmFooter(step: ConfirmStep) {
    const { classes } = this.props;
    const {
      mnemonic,
      mnemonicInvalid,
      passphrase,
      passphraseInvalid
    } = this.state;
    const isPassphraseSet = !step.secondPublicKey;

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
        component="form"
        onSubmit={this.handleFormSubmit}
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
            label={
              <FormattedMessage
                id="forms-confirm-tx.mnemonic-input-label"
                description="Label for mnemonic text field."
                defaultMessage="Account mnemonic secret"
              />
            }
            value={mnemonic}
            onChange={this.handleMnemonicChange}
            onBlur={this.handleMnemonicBlur}
            error={mnemonicInvalid}
            helperText={mnemonicInvalid ? this.mnemonicError() : ''}
            autoFocus={true}
            fullWidth={true}
          />
        </Grid>
        {isPassphraseSet && (
          <Grid item={true} xs={12}>
            <TextField
              label={
                <FormattedMessage
                  id="forms-confirm-tx.passphrase-input-label"
                  description="Label for 2nd passphrase text field."
                  defaultMessage="Second passphrase"
                />
              }
              value={passphrase}
              onChange={this.handlePassphraseChange}
              onBlur={this.handlePassphraseBlur}
              error={passphraseInvalid}
              helperText={passphraseInvalid ? this.passphraseError() : ''}
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
    );
  }

  renderInProgressFooter(step: InProgressStep) {
    const { classes } = this.props;

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
      >
        <Grid item={true} xs={12} className={classes.statusContainer}>
          <CircularProgress color="primary" />
          <Typography className={classes.statusMessage}>
            <FormattedMessage
              id="forms-confirm-tx.broadcasting-msg"
              description="Message for when a transaction is being broadcast."
              defaultMessage="Broadcasting transaction to the network. Please wait..."
            />
          </Typography>
        </Grid>
      </Grid>
    );
  }

  renderSuccessFooter(step: SuccessStep) {
    const { intl, classes, onCloseClick } = this.props;

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
      >
        <Grid item={true} xs={12} className={classes.statusContainer}>
          <DoneIcon
            className={classes.statusIcon}
            color="primary"
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
        <Grid item={true} xs={12}>
          <Button onClick={onCloseClick} fullWidth={true}>
            <FormattedMessage
              id="forms-confirm-tx.done-button"
              description="Label for done button."
              defaultMessage="Done"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }

  renderFailureFooter(step: FailureStep) {
    const { intl, classes, onCloseClick } = this.props;
    const canRetry = !!step.onRetry;

    return (
      <Grid container={true} spacing={16}>
        <Grid item={true} xs={12} className={classes.statusContainer}>
          <ErrorOutlineIcon
            className={classes.statusIcon}
            color="error"
            aria-label={intl.formatMessage(messages.errorIconAria)}
          />
          <Typography className={classes.statusMessage}>
            <FormattedMessage
              id="forms-confirm-tx.error-msg"
              description="Message for when a transaction failed to broadcast."
              defaultMessage={
                'Failed to broadcast the transaction to the network: {error}'}
              values={{
                error: step.reason || 'N/A'
              }}
            />
          </Typography>
        </Grid>
        {canRetry && (
          <Grid item={true} xs={12} sm={6}>
            <Button onClick={step.onRetry} fullWidth={true}>
              <FormattedMessage
                id="forms-confirm-tx.try-again-button"
                description="Label for try again button."
                defaultMessage="Try again"
              />
            </Button>
          </Grid>
        )}
        <Grid item={true} xs={12} sm={canRetry ? 6 : 12}>
          <Button onClick={onCloseClick} fullWidth={true}>
            <FormattedMessage
              id="forms-confirm-tx.close-button"
              description="Label for close button."
              defaultMessage="Close"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(ConfirmTransactionDialog));

function derivePublicKey(secret: string): string {
  const w = new LiskWallet(secret, 'R');
  return w.publicKey;
}

function emphasizeAndJoin(labels: string[], separator: string = ', '): JSX.Element {
  return (
      <React.Fragment>
        {labels
          .map(u => <em key={u}>{u}</em>)
          .reduce((a, u) => a.concat(a.length ? ', ' : null, u),
                  [] as Array<null | string | JSX.Element>)}
      </React.Fragment>
  );
}
