import green from '@material-ui/core/colors/green';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelActions from '@material-ui/core/ExpansionPanelActions';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PersonIcon from '@material-ui/icons/Person';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import LinkIcon from '@material-ui/icons/Link';
import ContentCopyIcon from 'mdi-material-ui/ContentCopy';
import * as classNames from 'classnames';
import { TransactionType } from 'dpos-api-wrapper';
import * as moment from 'moment-timezone';
import * as React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import { TTransaction } from '../stores/wallet';
import { RawAmount } from '../utils/amounts';
import { copyToClipboard } from '../utils/clipboard';

const styles = (theme: Theme) => {
  return createStyles({
    expanded: {},
    summaryRoot: {
      padding: `0 ${theme.spacing.unit * 3}px 0 ${theme.spacing.unit * 3}px`,
      [theme.breakpoints.down('xs')]: {
        padding: `0 ${theme.spacing.unit * 2}px 0 ${theme.spacing.unit * 2}px`
      },
      '&$expanded': {
        [theme.breakpoints.down('xs')]: {
          minHeight: 58
        }
      }
    },
    summaryContent: {
      display: 'flex',
      alignItems: 'center',
      '& > :last-child': {
        [theme.breakpoints.down('xs')]: {
          paddingRight: 0
        }
      },
      '&$expanded': {
        [theme.breakpoints.down('xs')]: {
          margin: '14px 0'
        }
      }
    },
    summaryExpandIcon: {
      [theme.breakpoints.down('xs')]: {
        display: 'none'
      }
    },
    summarySummary: {
      flex: 1,
      marginRight: 2 * theme.spacing.unit,
      wordBreak: 'break-word'
    },
    summaryIncomingAmount: {
      color: green[800]
    },
    shortText: {
      [theme.breakpoints.up('sm')]: {
        display: 'none'
      }
    },
    longText: {
      [theme.breakpoints.down('xs')]: {
        display: 'none'
      }
    },
    detailsRoot: {
      flexDirection: 'column',
      padding: `${theme.spacing.unit}px 0 0`,
      [theme.breakpoints.down('xs')]: {
        padding: `${theme.spacing.unit}px 0 0`
      }
    },
    detailsRow: {
      display: 'flex',
      paddingLeft: theme.spacing.unit * 3,
      paddingRight: theme.spacing.unit * 2,
      [theme.breakpoints.down('xs')]: {
        paddingLeft: theme.spacing.unit * 2,
        paddingRight: theme.spacing.unit * 2,
        flexWrap: 'wrap',
      },
      '&:nth-child(even)': {
        backgroundColor: '#fafafa',
      },
    },
    detailsRowLabel: {
      ...theme.typography.body2,
      order: 1,
      lineHeight: '28px',
      [theme.breakpoints.down('xs')]: {
        flex: 1,
      }
    },
    detailsRowValue: {
      order: 2,
      flex: 1,
      textAlign: 'right',
      lineHeight: '28px',
      marginLeft: theme.spacing.unit,
      [theme.breakpoints.down('xs')]: {
        order: 3,
        flex: 'none',
        width: '100%',
        textAlign: 'left',
        marginLeft: 0,
      }
    },
    detailsRowActions: {
      order: 3,
      minWidth: 2 * 28,
      marginLeft: theme.spacing.unit,
      [theme.breakpoints.down('xs')]: {
        order: 2,
      }
    },
    detailsRowAction: {
      width: 28,
      height: 28,
      fontSize: theme.typography.pxToRem(14),
    },
  });
};

interface Props extends WithStyles<typeof styles> {
  tx: TTransaction;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'TxDetailsExpansionPanel' });

const messages = defineMessages({
  // receive
  summaryReceiveAliasLong: {
    id: 'tx-details-expansion-panel.summary-receive-alias-long',
    description: 'Summary text for receive operation with an alias',
    defaultMessage: 'Transfer from {alias} ({address})'
  },
  summaryReceiveAliasShort: {
    id: 'tx-details-expansion-panel.summary-receive-alias-short',
    description:
      'Summary text for receive operation with an alias (short version)',
    defaultMessage: 'From {alias} ({address})'
  },
  summaryReceiveLong: {
    id: 'tx-details-expansion-panel.summary-receive-long',
    description: 'Summary text for receive operation without an alias',
    defaultMessage: 'Transfer from {address}'
  },
  summaryReceiveShort: {
    id: 'tx-details-expansion-panel.summary-receive-short',
    description:
      'Summary text for receive operation without an alias (short version)',
    defaultMessage: 'From {address}'
  },
  // send
  summarySendAliasLong: {
    id: 'tx-details-expansion-panel.summary-send-alias-long',
    description: 'Summary text for send operation with an alias',
    defaultMessage: 'Transfer to {alias} ({address})'
  },
  summarySendAliasShort: {
    id: 'tx-details-expansion-panel.summary-send-alias-short',
    description:
      'Summary text for send operation with an alias (short version)',
    defaultMessage: 'To {alias} ({address})'
  },
  summarySendLong: {
    id: 'tx-details-expansion-panel.summary-send-long',
    description: 'Summary text for send operation without an alias',
    defaultMessage: 'Transfer to {address}'
  },
  summarySendShort: {
    id: 'tx-details-expansion-panel.summary-send-short',
    description:
      'Summary text for send operation without an alias (short version)',
    defaultMessage: 'To {address}'
  }
});

class TxDetailsExpansionPanel extends React.Component<DecoratedProps> {
  getSummary() {
    const { intl, tx } = this.props;

    let summaryShort = '',
      summaryLong = '';
    let amount = RawAmount.ZERO;

    if (tx.isIncoming) {
      if (!tx.senderName) {
        const data = { address: tx.recipientId };
        summaryLong = intl.formatMessage(messages.summaryReceiveLong, data);
        summaryShort = intl.formatMessage(messages.summaryReceiveShort, data);
      } else {
        const data = {
          alias: tx.senderName,
          address: tx.senderId
        };
        summaryLong = intl.formatMessage(
          messages.summaryReceiveAliasLong,
          data
        );
        summaryShort = intl.formatMessage(
          messages.summaryReceiveAliasShort,
          data
        );
      }
      amount = tx.amount;
    } else {
      if (tx.type !== TransactionType.SEND) {
        // network service (eg 2nd passphrase)
        const data = { address: tx.recipientName };
        summaryLong = intl.formatMessage(messages.summarySendLong, data);
        summaryShort = intl.formatMessage(messages.summarySendShort, data);
      } else if (!tx.recipientName) {
        // regular send
        const data = { address: tx.recipientId };
        summaryLong = intl.formatMessage(messages.summarySendLong, data);
        summaryShort = intl.formatMessage(messages.summarySendShort, data);
      } else {
        // regular send
        const data = {
          alias: tx.recipientName,
          address: tx.recipientId
        };
        summaryLong = intl.formatMessage(messages.summarySendAliasLong, data);
        summaryShort = intl.formatMessage(messages.summarySendAliasShort, data);
      }
      amount = RawAmount.ZERO.minus(tx.amountFee);
    }

    let amountSign = '';
    if (amount.gt(RawAmount.ZERO)) {
      amountSign = '+';
    }
    let amountShort = `${amountSign}${intl.formatNumber(
      amount.unit.toNumber(),
      {
        style: 'decimal'
      }
    )}`;
    let amountLong = `${amountShort} RISE`;

    return { summaryShort, summaryLong, amount, amountLong, amountShort };
  }

  render() {
    const { classes, tx, intl } = this.props;

    const {
      summaryShort,
      summaryLong,
      amount,
      amountLong,
      amountShort
    } = this.getSummary();

    const timestamp = moment(tx.timestamp).toDate();

    return (
      <ExpansionPanel>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          classes={{
            root: classes.summaryRoot,
            content: classes.summaryContent,
            expanded: classes.expanded,
            expandIcon: classes.summaryExpandIcon
          }}
        >
          <Typography
            className={classNames(classes.summarySummary, classes.longText)}
          >
            {summaryLong}
          </Typography>
          <Typography
            className={classNames(classes.summarySummary, classes.shortText)}
            aria-label={summaryLong}
          >
            {/* Use the long summary instead of short one for screen readers */}
            <span aria-hidden={true}>{summaryShort}</span>
          </Typography>
          <div>
            <Typography
              className={classNames(classes.longText, {
                [classes.summaryIncomingAmount]: amount.gt(RawAmount.ZERO)
              })}
              variant="body2"
            >
              {amountLong}
            </Typography>
            <Typography
              className={classNames(classes.shortText, {
                [classes.summaryIncomingAmount]: amount.gt(RawAmount.ZERO)
              })}
              variant="body2"
              aria-label={amountLong}
            >
              {/* Use the long summary instead of short one for screen readers */}
              <span aria-hidden={true}>{amountShort}</span>
            </Typography>
          </div>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails
          classes={{
            root: classes.detailsRoot
          }}
        >
          <Typography className={classes.detailsRow}>
            <span className={classes.detailsRowLabel}>Status:</span>
            <span className={classes.detailsRowValue}>
              {tx.confirmations === 0 ? 'Unconfirmed'
                : tx.confirmations < 101 ? 'Confirmed (settling - n/101)'
                : 'Confirmed (settled)'}
            </span>
            <span className={classes.detailsRowActions} />
          </Typography>
          <Typography className={classes.detailsRow}>
            <span className={classes.detailsRowLabel}>Timestamp:</span>
            <time
              className={classes.detailsRowValue}
              dateTime={timestamp.toISOString()}
            >
              {intl.formatDate(timestamp)} {intl.formatTime(timestamp)}
            </time>
            <span className={classes.detailsRowActions} />
          </Typography>
          <Typography className={classes.detailsRow}>
            <span className={classes.detailsRowLabel}>Transaction ID:</span>
            <span className={classes.detailsRowValue}>{tx.id}</span>
            <span className={classes.detailsRowActions}>
              <Tooltip title="Copy ID">
                <IconButton
                  className={classes.detailsRowAction}
                  aria-label="Copy transaction ID"
                  onClick={this.handleCopyTxId}
                >
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title="View in explorer">
                <IconButton
                  className={classes.detailsRowAction}
                  aria-label="View transaction in explorer"
                >
                  <LinkIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </span>
          </Typography>
          <Typography className={classes.detailsRow}>
            <span className={classes.detailsRowLabel}>Block ID:</span>
            <span className={classes.detailsRowValue}>
              {tx.blockId}
            </span>
            <span className={classes.detailsRowActions}>
              <Tooltip title="Copy ID">
                <IconButton
                  className={classes.detailsRowAction}
                  aria-label="Copy block ID"
                  onClick={this.handleCopyBlockId}
                >
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title="View in explorer">
                <IconButton
                  className={classes.detailsRowAction}
                  aria-label="View block in explorer"
                >
                  <LinkIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </span>
          </Typography>
          <Typography className={classes.detailsRow}>
            <span className={classes.detailsRowLabel}>Transaction type:</span>
            <span className={classes.detailsRowValue}>
              TODO
            </span>
            <span className={classes.detailsRowActions} />
          </Typography>
          <Typography className={classes.detailsRow}>
            <span className={classes.detailsRowLabel}>Sender:</span>
            <span className={classes.detailsRowValue}>
              {tx.senderName} ({tx.senderId})
            </span>
            <span className={classes.detailsRowActions}>
              <Tooltip title="Copy address">
                <IconButton
                  className={classes.detailsRowAction}
                  aria-label="Copy sender address"
                  onClick={this.handleCopySenderAddress}
                >
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit contact">
                <IconButton
                  className={classes.detailsRowAction}
                  aria-label="Edit sender contact card"
                >
                  <PersonIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </span>
          </Typography>
          <Typography className={classes.detailsRow}>
            <span className={classes.detailsRowLabel}>Recipient:</span>
            <span className={classes.detailsRowValue}>
              {tx.recipientName} ({tx.recipientId})
            </span>
            <span className={classes.detailsRowActions}>
              <Tooltip title="Copy address">
                <IconButton
                  className={classes.detailsRowAction}
                  aria-label="Copy recipient address"
                  onClick={this.handleCopyRecipientAddress}
                >
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add contact">
                <IconButton
                  className={classes.detailsRowAction}
                  aria-label="Add recipient to contacts"
                >
                  <PersonAddIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </span>
          </Typography>
          <Typography className={classes.detailsRow}>
            <span className={classes.detailsRowLabel}>Send amount:</span>
            <span className={classes.detailsRowValue}>
              {intl.formatNumber(tx.amount.unit.toNumber(), {
                style: 'decimal'
              })} RISE
            </span>
            <span className={classes.detailsRowActions} />
          </Typography>
          <Typography className={classes.detailsRow}>
            <span className={classes.detailsRowLabel}>Registered username:</span>
            <span className={classes.detailsRowValue}>
              TODO
            </span>
            <span className={classes.detailsRowActions} />
          </Typography>
          <Typography className={classes.detailsRow}>
            <span className={classes.detailsRowLabel}>Vote(s) removed:</span>
            <span className={classes.detailsRowValue}>
              TODO
            </span>
            <span className={classes.detailsRowActions} />
          </Typography>
          <Typography className={classes.detailsRow}>
            <span className={classes.detailsRowLabel}>Vote(s) added:</span>
            <span className={classes.detailsRowValue}>
              TODO
            </span>
            <span className={classes.detailsRowActions} />
          </Typography>
          <Typography className={classes.detailsRow}>
            <span className={classes.detailsRowLabel}>Network fee:</span>
            <span className={classes.detailsRowValue}>
              {intl.formatNumber(tx.fee.unit.toNumber(), {
                style: 'decimal'
              })} RISE
            </span>
            <span className={classes.detailsRowActions} />
          </Typography>
        </ExpansionPanelDetails>
        <ExpansionPanelActions>
          {true && <Button size="small">Return funds</Button>}
          {false && <Button size="small">Send again</Button>}
        </ExpansionPanelActions>
      </ExpansionPanel>
    );
  }

  handleCopyTxId = () => {
    const { tx } = this.props;
    copyToClipboard(tx.id);
  }

  handleCopyBlockId = () => {
    const { tx } = this.props;
    copyToClipboard(tx.blockId);
  }

  handleCopySenderAddress = () => {
    const { tx } = this.props;
    copyToClipboard(tx.senderId);
  }

  handleCopyRecipientAddress = () => {
    const { tx } = this.props;
    copyToClipboard(tx.recipientId);
  }
}

export default stylesDecorator(injectIntl(TxDetailsExpansionPanel));
