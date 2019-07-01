import Divider from '@material-ui/core/es/Divider';
import Grid from '@material-ui/core/es/Grid';
import Typography from '@material-ui/core/es/Typography';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/es/styles';
import classNames from 'classnames';
import React from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import { formatAmount } from '../../utils/utils';
import {
  DialogContentProps,
  SetDialogContent,
  ICloseInterruptFormProps
} from '../Dialog';
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
        paddingTop: theme.spacing.unit * 2
      },
      '&:last-child': {
        paddingBottom: theme.spacing.unit * 2
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
      ...theme.typography.body2,
      fontWeight: 500
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
    }
  });

const stylesDecorator = withStyles(styles, {
  name: 'ConfirmTransactionDialogContent'
});

const messages = defineMessages({
  dialogTitle: {
    id: 'confirm-tx-dialog-content.dialog-title',
    description: 'Confirm transaction dialog title',
    defaultMessage: 'Confirm transaction'
  },
  unnamedSender: {
    id: 'confirm-tx-dialog-content.unnamed-sender',
    description: 'Unnamed sender account',
    defaultMessage: 'Unnamed account ({id})'
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

type BaseProps = WithStyles<typeof styles> & DialogContentProps;

interface Props extends BaseProps, ICloseInterruptFormProps {
  data: TxData;
  fee: RawAmount;
  senderName: string | null;
  senderLocalId: number;
  senderAddress: string;
}

type DecoratedProps = Props & InjectedIntlProps;

class ConfirmTransactionDialogContent extends React.Component<DecoratedProps> {
  componentWillMount() {
    const { intl } = this.props;

    SetDialogContent(this, {
      title: intl.formatMessage(messages.dialogTitle)
    });
  }

  render() {
    const { intl, classes, data, fee, senderAddress, children } = this.props;

    const total = fee.plus(data.kind === 'send' ? data.amount : RawAmount.ZERO);
    const recipientAddress = data.kind === 'send' ? data.recipientAddress : '';
    let senderName = this.props.senderName;
    if (!senderName) {
      senderName = intl.formatMessage(messages.unnamedSender, {
        id: this.props.senderLocalId
      });
    }
    let recipientName = data.kind === 'send' ? data.recipientName : null;
    if (!recipientName) {
      recipientName = intl.formatMessage(messages.unnamedRecipient);
    }

    let txTitleAria = '';
    if (data.kind === 'send') {
      txTitleAria = intl.formatMessage(messages.sendTxTitleAria, {
        amount: formatAmount(intl, data.amount)
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
        <Grid className={classes.content} container={true} spacing={16}>
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
                  {formatAmount(intl, data.amount)}
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
              className={classNames(classes.content, classes.txDetails)}
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
        <Grid className={classes.content} container={true} spacing={16}>
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
                <span>{formatAmount(intl, data.amount)}</span>
              </Typography>
            )}
            <Typography>
              <FormattedMessage
                id="confirm-tx-dialog-content.breakdown-fee-label"
                description="Label for network fee in transaction breakdown."
                defaultMessage="Network fee:"
              />{' '}
              <span>{formatAmount(intl, fee)}</span>
            </Typography>
            <Typography>
              <FormattedMessage
                id="confirm-tx-dialog-content.breakdown-total-label"
                description="Label for total cost in transaction breakdown."
                defaultMessage="Total:"
              />{' '}
              <span className={classes.totalAmount}>
                {formatAmount(intl, total)}
              </span>
            </Typography>
          </Grid>
        </Grid>
        <Divider aria-hidden={true} />
        {children}
      </React.Fragment>
    );
  }
}

export default stylesDecorator(injectIntl(ConfirmTransactionDialogContent));

function emphasizeAndJoin(
  labels: string[],
  separator: string = ', '
): JSX.Element {
  return (
    <React.Fragment>
      {labels
        .map(u => <em key={u}>{u}</em>)
        .reduce((a, u) => a.concat(a.length ? ', ' : null, u), [] as Array<
          null | string | JSX.Element
        >)}
    </React.Fragment>
  );
}
