import green from '@material-ui/core/colors/green';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import * as classNames from 'classnames';
import { TransactionType } from 'dpos-api-wrapper';
import * as React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import { TTransaction } from '../stores/wallet';
import { RawAmount } from '../utils/amounts';

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
    detailsRoot: {
      padding: `${theme.spacing.unit}px ${theme.spacing.unit * 3}px ${theme
        .spacing.unit * 3}px`,
      [theme.breakpoints.down('xs')]: {
        padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px ${theme
          .spacing.unit * 2}px`
      }
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
    }
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
      amount = tx.amountFee;
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
          <Typography>
            <ul>
              <li>ID: {tx.id}</li>
              <li>Confirmations: {tx.confirmations}</li>
              <li>
                Amount:{' '}
                {intl.formatNumber(tx.amount.toNumber(), {
                  style: 'decimal'
                })}
              </li>
              <li>
                Fee:{' '}
                {intl.formatNumber(tx.fee.toNumber(), {
                  style: 'decimal'
                })}
              </li>
              <li>Fiat: TODO</li>
              <li>Time: {tx.time}</li>
            </ul>
          </Typography>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  }
}

export default stylesDecorator(injectIntl(TxDetailsExpansionPanel));
