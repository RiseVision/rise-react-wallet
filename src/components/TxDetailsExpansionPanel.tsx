import * as React from 'react';
import * as classNames from 'classnames';
import { InjectedIntlProps, injectIntl, defineMessages } from 'react-intl';
import { Theme, createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import green from '@material-ui/core/colors/green';

const styles = (theme: Theme) => {
  return createStyles({
    summary_content: {
      display: 'flex',
      alignItems: 'center',
    },
    summary_summary: {
      flex: 1,
      marginRight: 2 * theme.spacing.unit,
    },
    summary_incoming_amount: {
      color: green[800],
    },
    short_text: {
      [theme.breakpoints.up('sm')]: {
        display: 'none',
      },
    },
    long_text: {
      [theme.breakpoints.down('xs')]: {
        display: 'none',
      },
    },
  });
};

interface ReceiveTxInfo {
  kind: 'receive';
  sender_alias: string | null;
  sender_address: string;
  amount: number;
}

interface SendTxInfo {
  kind: 'send';
  recipient_alias: string | null;
  recipient_address: string;
  amount: number;
}

type TxInfo = ReceiveTxInfo | SendTxInfo;

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
      let amount = 0;

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
          amount = -tx.amount;
          break;
        }
        default: throwInvalidTxKind(tx);
      }

      let amountSign = '';
      if (amount > 0) {
        amountSign = '+';
      }
      let amountShort = `${amountSign}${intl.formatNumber(amount, {
        style: 'decimal',
      })}`;
      let amountLong = `${amountShort} RISE`;

      return (
        <ExpansionPanel>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon />}
            classes={{
              content: classes.summary_content,
            }}
          >
            <div className={classes.summary_summary}>
              <Typography
                className={classes.long_text}
              >
                {summaryLong}
              </Typography>
              <Typography
                className={classes.short_text}
                aria-label={summaryLong}
              >
                {/* Use the long summary instead of short one for screen readers */}
                <span aria-hidden={true}>
                  {summaryShort}
                </span>
              </Typography>
            </div>
            <div>
              <Typography
                className={classNames(
                  classes.long_text,
                  {
                    [classes.summary_incoming_amount]: amount > 0,
                  },
                )}
                variant="body2"
              >
                {amountLong}
              </Typography>
              <Typography
                className={classNames(
                  classes.short_text,
                  {
                    [classes.summary_incoming_amount]: amount > 0,
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
          <ExpansionPanelDetails>
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
