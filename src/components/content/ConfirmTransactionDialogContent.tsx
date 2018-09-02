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
import { ReactEventHandler } from 'react';
import { ChangeEvent, FormEvent } from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import { LiskWallet } from 'dpos-offline';
import { DialogContentProps, SetDialogContent } from '../Dialog';
import { RawAmount } from '../../utils/amounts';
import AccountIcon from '../AccountIcon';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      paddingLeft: theme.spacing.unit * 2,
      paddingRight: theme.spacing.unit * 2,
      paddingTop: theme.spacing.unit,
      paddingBottom: theme.spacing.unit,
      textAlign: 'center',
      '&:first-child': {
        paddingTop: theme.spacing.unit * 2,
      },
      '&:last-child': {
        paddingBottom: theme.spacing.unit * 2,
      }
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
      width: 0,
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

const stylesDecorator = withStyles(styles, { name: 'ConfirmTransactionDialogContent' });

const messages = defineMessages({
  dialogTitle: {
    id: 'confirm-tx-dialog-content.dialog-title',
    description: 'Confirm transaction dialog title',
    defaultMessage: 'Confirm transaction'
  },
  unnamedSender: {
    id: 'confirm-tx-dialog-content.unnamed-sender',
    description: 'Unnamed sender account',
    defaultMessage: 'Unnamed account'
  },
  unnamedRecipient: {
    id: 'confirm-tx-dialog-content.unnamed-recipient',
    description: 'Unnamed recipient account',
    defaultMessage: 'Unknown recipient'
  },
  sendTxTitleAria: {
    id: 'confirm-tx-dialog-content.send-title-aria',
    description: 'Send transaction title for accessibility',
    defaultMessage: 'Send transaction of {amount}'
  },
  passphraseTxTitleAria: {
    id: 'confirm-tx-dialog-content.passphrase-title-aria',
    description: '2nd passphrase transaction title for accessibility',
    defaultMessage: 'Setup 2nd passphrase transaction'
  },
  delegateTxTitleAria: {
    id: 'confirm-tx-dialog-content.delegate-title-aria',
    description: 'Register as delegate transaction title for accessibility',
    defaultMessage: 'Register as a delegate transaction'
  },
  voteTxTitleAria: {
    id: 'confirm-tx-dialog-content.vote-title-aria',
    description: 'Vote transaction title for accessibility',
    defaultMessage: 'Vote transaction'
  },
  senderSummaryAria: {
    id: 'confirm-tx-dialog-content.sender-summary-aria',
    description: 'Sender summary for accessibility',
    defaultMessage: 'From {account} ({address})'
  },
  recipientSummaryAria: {
    id: 'confirm-tx-dialog-content.recipient-summary-aria',
    description: 'Recipient summary for accessibility',
    defaultMessage: 'To {account} ({address})'
  },
  txDetailsAria: {
    id: 'confirm-tx-dialog-content.details-section-aria',
    description: 'Transaction details section title for accessibility',
    defaultMessage: 'Transaction details'
  },
  txBreakdownAria: {
    id: 'confirm-tx-dialog-content.breakdown-section-aria',
    description: 'Transaction breakdown section title for accessibility',
    defaultMessage: 'Transaction cost breakdown'
  },
  errorIconAria: {
    id: 'confirm-tx-dialog-content.error-icon-aria',
    description: 'Error status icon label for accessibility',
    defaultMessage: 'Error indicator icon'
  },
  successIconAria: {
    id: 'confirm-tx-dialog-content.success-icon-aria',
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
  recipientAddress: string;
  recipientName: string | null;
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
  onConfirm: (data: { mnemonic: string; passphrase: null | string }) => void;
};

type InProgressStep = {
  kind: 'in-progress';
};

type SuccessStep = {
  kind: 'success';
  onClose: ReactEventHandler<{}>;
};

type FailureStep = {
  kind: 'failure';
  onRetry?: ReactEventHandler<{}>;
  onClose: ReactEventHandler<{}>;
  reason: string;
};

type Step =
  | ConfirmStep
  | InProgressStep
  | SuccessStep
  | FailureStep;

type BaseProps = WithStyles<typeof styles>
  & DialogContentProps;

interface Props extends BaseProps {
  data: TxData;
  fee: RawAmount;
  senderName: string | null;
  senderAddress: string;
  step: Step;
}

type DecoratedProps = Props & InjectedIntlProps;

interface State {
  mnemonic: string;
  mnemonicInvalid: boolean;
  passphrase: string;
  passphraseInvalid: boolean;
}

class ConfirmTransactionDialogContent extends React.Component<DecoratedProps, State> {
  state = {
    mnemonic: '',
    mnemonicInvalid: false,
    passphrase: '',
    passphraseInvalid: false,
  };

  handleMnemonicChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const mnemonic = ev.target.value;
    this.setState({
      mnemonic,
      mnemonicInvalid: false,
    });
  }

  handleMnemonicBlur = () => {
    const { mnemonic } = this.state;
    const mnemonicInvalid = !!mnemonic && !!this.mnemonicError();
    this.setState({ mnemonicInvalid });
  }

  handlePassphraseChange = (ev: ChangeEvent<HTMLInputElement>) => {
    const passphrase = ev.target.value;
    this.setState({
      passphrase,
      passphraseInvalid: false,
    });
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
      const passphraseInvalid = !!step.secondPublicKey && !!this.passphraseError();

      if (mnemonicInvalid || passphraseInvalid) {
        this.setState({
          mnemonicInvalid,
          passphraseInvalid,
        });
        return;
      }

      const { mnemonic, passphrase } = this.state;
      step.onConfirm({
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

  componentWillMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle),
    });
  }

  render() {
    const {
      intl,
      classes,
      data,
      fee,
      senderAddress,
      step
    } = this.props;

    // TODO extract
    const formatAmount = (amount: RawAmount) =>
      `${intl.formatNumber(amount.unit.toNumber())} RISE`;

    const total = fee.plus(data.kind === 'send' ? data.amount : RawAmount.ZERO);
    const recipientAddress = data.kind === 'send' ? data.recipientAddress : '';
    let senderName = this.props.senderName;
    if (!senderName) {
      senderName = intl.formatMessage(messages.unnamedSender);
    }
    let recipientName = data.kind === 'send' ? data.recipientName : null;
    if (!recipientName) {
      recipientName = intl.formatMessage(messages.unnamedRecipient);
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
      <React.Fragment>
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
            <AccountIcon size={64} address={senderAddress} />
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
            <AccountIcon size={64} address={recipientAddress} />
          </Grid>
          <Grid
            item={true}
            xs={12}
            sm={6}
            className={classes.senderInfo}
            aria-label={intl.formatMessage(messages.senderSummaryAria, {
              account: senderName,
              address: senderAddress
            })}
          >
            <Typography
              className={classes.accountAlias}
              aria-hidden={true}
              children={senderName}
            />
            <Typography
              className={classes.accountAddress}
              aria-hidden={true}
              children={senderAddress}
            />
          </Grid>
          {data.kind === 'send' && (
            <Grid
              item={true}
              xs={12}
              sm={6}
              className={classes.recipientInfo}
              aria-label={intl.formatMessage(messages.recipientSummaryAria, {
                account: recipientName,
                address: recipientAddress
              })}
            >
              <Typography
                className={classes.accountAlias}
                aria-hidden={true}
                children={recipientName}
              />
              <Typography
                className={classes.accountAddress}
                aria-hidden={true}
                children={recipientAddress}
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
                      id="confirm-tx-dialog-content.details-add-passphrase"
                      description="Transaction detail row for 2nd passphrase setup."
                      defaultMessage="Setup 2nd passphrase for account."
                    />
                  </Typography>
                )}
                {data.kind === 'delegate' && (
                  <Typography>
                    <FormattedMessage
                      id="confirm-tx-dialog-content.details-register-delegate"
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
                    {data.remove.length > 0 && (
                      <Typography>
                        <FormattedMessage
                          id="confirm-tx-dialog-content.details-remove-votes"
                          description="Transaction detail row for vote removal."
                          defaultMessage={
                            'Remove {delegateCount, plural,' +
                            '  one {vote}' +
                            '  other {votes}' +
                            '} form {delegates}.'
                          }
                          values={{
                            delegateCount: data.remove.length,
                            delegates: emphasizeAndJoin(data.remove)
                          }}
                        />
                      </Typography>
                    )}
                    {data.add.length > 0 && (
                      <Typography>
                        <FormattedMessage
                          id="confirm-tx-dialog-content.details-add-votes"
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
        <Grid
          className={classes.content}
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
                  id="confirm-tx-dialog-content.breakdown-amount-label"
                  description="Label for transfer amount in transaction breakdown."
                  defaultMessage="Transfer amount:"
                />{' '}
                <span>{formatAmount(data.amount)}</span>
              </Typography>
            )}
            <Typography>
              <FormattedMessage
                id="confirm-tx-dialog-content.breakdown-fee-label"
                description="Label for network fee in transaction breakdown."
                defaultMessage="Network fee:"
              />{' '}
              <span>{formatAmount(fee)}</span>
            </Typography>
            <Typography>
              <FormattedMessage
                id="confirm-tx-dialog-content.breakdown-total-label"
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
      </React.Fragment>
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
    const isPassphraseSet = !!step.secondPublicKey;

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
                id="confirm-tx-dialog-content.instructions-with-passphrase"
                description="Instructions on how to confirm the transaction (with 2nd passphrase set)."
                defaultMessage={
                  'To confirm this transaction, enter your mnemonic secret ' +
                  'and the 2nd passphrase into the text fields below.'
                }
              />
            ) : (
              <FormattedMessage
                id="confirm-tx-dialog-content.instructions"
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
            type="password"
            label={
              <FormattedMessage
                id="confirm-tx-dialog-content.mnemonic-input-label"
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
              type="password"
              label={
                <FormattedMessage
                  id="confirm-tx-dialog-content.passphrase-input-label"
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
              id="confirm-tx-dialog-content.sign-button"
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
              id="confirm-tx-dialog-content.broadcasting-msg"
              description="Message for when a transaction is being broadcast."
              defaultMessage="Broadcasting transaction to the network. Please wait..."
            />
          </Typography>
        </Grid>
      </Grid>
    );
  }

  renderSuccessFooter(step: SuccessStep) {
    const { intl, classes } = this.props;

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
              id="confirm-tx-dialog-content.success-msg"
              description="Message for when a transaction broadcast succeeded."
              defaultMessage="The transaction was successfully broadcast to the network!"
            />
          </Typography>
        </Grid>
        <Grid item={true} xs={12}>
          <Button onClick={step.onClose} fullWidth={true}>
            <FormattedMessage
              id="confirm-tx-dialog-content.done-button"
              description="Label for done button."
              defaultMessage="Done"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }

  renderFailureFooter(step: FailureStep) {
    const { intl, classes } = this.props;
    const canRetry = !!step.onRetry;

    return (
      <Grid
        className={classes.content}
        container={true}
        spacing={16}
      >
        <Grid item={true} xs={12} className={classes.statusContainer}>
          <ErrorOutlineIcon
            className={classes.statusIcon}
            color="error"
            aria-label={intl.formatMessage(messages.errorIconAria)}
          />
          <Typography className={classes.statusMessage}>
            <FormattedMessage
              id="confirm-tx-dialog-content.error-msg"
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
                id="confirm-tx-dialog-content.try-again-button"
                description="Label for try again button."
                defaultMessage="Try again"
              />
            </Button>
          </Grid>
        )}
        <Grid item={true} xs={12} sm={canRetry ? 6 : 12}>
          <Button onClick={step.onClose} fullWidth={true}>
            <FormattedMessage
              id="confirm-tx-dialog-content.close-button"
              description="Label for close button."
              defaultMessage="Close"
            />
          </Button>
        </Grid>
      </Grid>
    );
  }
}

export default stylesDecorator(injectIntl(ConfirmTransactionDialogContent));

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
