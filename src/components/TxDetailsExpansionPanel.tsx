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
import * as React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import { RawAmount } from '../utils/amounts';

const styles = (theme: Theme) => {
  return createStyles({
    expanded: {},
    summaryRoot: {
      padding: `0 ${theme.spacing.unit * 3}px 0 ${theme.spacing.unit * 3}px`,
      [theme.breakpoints.down('xs')]: {
        padding: `0 ${theme.spacing.unit * 2}px 0 ${theme.spacing.unit * 2}px`,
      },
      '&$expanded': {
        [theme.breakpoints.down('xs')]: {
          minHeight: 58,
        },
      },
    },
    summaryContent: {
      display: 'flex',
      alignItems: 'center',
      '& > :last-child': {
        [theme.breakpoints.down('xs')]: {
          paddingRight: 0,
        },
      },
      '&$expanded': {
        [theme.breakpoints.down('xs')]: {
          margin: '14px 0',
        },
      },
    },
    summaryExpandIcon: {
      [theme.breakpoints.down('xs')]: {
        display: 'none',
      },
    },
    summarySummary: {
      flex: 1,
      marginRight: 2 * theme.spacing.unit,
      wordBreak: 'break-word',
    },
    summaryIncomingAmount: {
      color: green[800],
    },
    detailsRoot: {
      padding: `${theme.spacing.unit}px ${theme.spacing.unit * 3}px ${theme.spacing.unit * 3}px`,
      [theme.breakpoints.down('xs')]: {
        padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px ${theme.spacing.unit * 2}px`,
      },
    },
    shortText: {
      [theme.breakpoints.up('sm')]: {
        display: 'none',
      },
    },
    longText: {
      [theme.breakpoints.down('xs')]: {
        display: 'none',
      },
    },
  });
};

// TODO unify ReceiveTxInfo and SendTxInfo into the same format
//   and a `type` field
export interface ReceiveTxInfo {
  kind: 'receive';
  sender_alias: string | null;
  sender_address: string;
  amount: RawAmount;
}

export interface SendTxInfo {
  kind: 'send';
  recipient_alias: string | null;
  recipient_address: string;
  amount: RawAmount;
}

export type TxInfo = ReceiveTxInfo | SendTxInfo;

interface Props extends WithStyles<typeof styles> {
  tx: TxInfo;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'TxDetailsExpansionPanel' });

const messages = defineMessages({
  summaryReceiveAliasLong: {
    id: 'tx-details-expansion-panel.summary-receive-alias-long',
    description: 'Summary text for receive operation with an alias',
    defaultMessage: 'Transfer from {alias} ({address})',
  },
  summaryReceiveAliasShort: {
    id: 'tx-details-expansion-panel.summary-receive-alias-short',
    description: 'Summary text for receive operation with an alias (short version)',
    defaultMessage: 'From {alias} ({address})',
  },
  summaryReceiveLong: {
    id: 'tx-details-expansion-panel.summary-receive-long',
    description: 'Summary text for receive operation without an alias',
    defaultMessage: 'Transfer from {address}',
  },
  summaryReceiveShort: {
    id: 'tx-details-expansion-panel.summary-receive-short',
    description: 'Summary text for receive operation without an alias (short version)',
    defaultMessage: 'From {address}',
  },
  summarySendAliasLong: {
    id: 'tx-details-expansion-panel.summary-send-alias-long',
    description: 'Summary text for send operation with an alias',
    defaultMessage: 'Transfer to {alias} ({address})',
  },
  summarySendAliasShort: {
    id: 'tx-details-expansion-panel.summary-send-alias-short',
    description: 'Summary text for send operation with an alias (short version)',
    defaultMessage: 'To {alias} ({address})',
  },
  summarySendLong: {
    id: 'tx-details-expansion-panel.summary-send-long',
    description: 'Summary text for send operation without an alias',
    defaultMessage: 'Transfer to {address}',
  },
  summarySendShort: {
    id: 'tx-details-expansion-panel.summary-send-short',
    description: 'Summary text for send operation without an alias (short version)',
    defaultMessage: 'To {address}',
  },
});

const TxDetailsExpansionPanel = stylesDecorator(injectIntl(
  class extends React.Component<DecoratedProps> {
    render() {
      const {
        intl,
        classes,
        tx,
      } = this.props;

      let summaryShort = '', summaryLong = '';
      let amount = RawAmount.ZERO;

      switch (tx.kind) {
        case 'receive': {
          if (tx.sender_alias == null) {
            summaryLong = intl.formatMessage(messages.summaryReceiveLong, {
              address: tx.sender_address,
            });
            summaryShort = intl.formatMessage(messages.summaryReceiveShort, {
              address: tx.sender_address,
            });
          } else {
            summaryLong = intl.formatMessage(messages.summaryReceiveAliasLong, {
              alias: tx.sender_alias,
              address: tx.sender_address,
            });
            summaryShort = intl.formatMessage(messages.summaryReceiveAliasShort, {
              alias: tx.sender_alias,
              address: tx.sender_address,
            });
          }
          amount = tx.amount;
          break;
        }
        case 'send': {
          if (tx.recipient_alias == null) {
            summaryLong = intl.formatMessage(messages.summarySendLong, {
              address: tx.recipient_address,
            });
            summaryShort = intl.formatMessage(messages.summarySendShort, {
              address: tx.recipient_address,
            });
          } else {
            summaryLong = intl.formatMessage(messages.summarySendAliasLong, {
              alias: tx.recipient_alias,
              address: tx.recipient_address,
            });
            summaryShort = intl.formatMessage(messages.summarySendAliasShort, {
              alias: tx.recipient_alias,
              address: tx.recipient_address,
            });
          }
          amount = RawAmount.ZERO.minus(tx.amount);
          break;
        }
        default: throwInvalidTxKind(tx);
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

      return (
        <ExpansionPanel>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon />}
            classes={{
              root: classes.summaryRoot,
              content: classes.summaryContent,
              expanded: classes.expanded,
              expandIcon: classes.summaryExpandIcon,
            }}
          >
            <Typography
              className={classNames(
                classes.summarySummary,
                classes.longText,
              )}
            >
              {summaryLong}
            </Typography>
            <Typography
              className={classNames(
                classes.summarySummary,
                classes.shortText,
              )}
              aria-label={summaryLong}
            >
              {/* Use the long summary instead of short one for screen readers */}
              <span aria-hidden={true}>
                {summaryShort}
              </span>
            </Typography>
            <div>
              <Typography
                className={classNames(
                  classes.longText,
                  {
                    [classes.summaryIncomingAmount]: amount.gt(RawAmount.ZERO),
                  },
                )}
                variant="body2"
              >
                {amountLong}
              </Typography>
              <Typography
                className={classNames(
                  classes.shortText,
                  {
                    [classes.summaryIncomingAmount]: amount.gt(RawAmount.ZERO),
                  },
                )}
                variant="body2"
                aria-label={amountLong}
              >
                {/* Use the long summary instead of short one for screen readers */}
                <span aria-hidden={true}>
                  {amountShort}
                </span>
              </Typography>
            </div>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails
            classes={{
              root: classes.detailsRoot,
            }}
          >
            <Typography>
              TODO: Transaction details
            </Typography>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      );
    }
  }
));

function throwInvalidTxKind(tx: never): never;
function throwInvalidTxKind(tx: TxInfo) {
  throw new Error(`Invalid transaction kind: ${tx.kind}`);
}

export default TxDetailsExpansionPanel;
