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
  summaryUnconfirmedReceiveAliasLong: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-receive-alias-long',
    description: 'Summary text for unconfirmed receive operation with an alias',
    defaultMessage: 'Pending transfer from {alias} ({address})'
  },
  summaryUnconfirmedReceiveAliasShort: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-receive-alias-short',
    description:
      'Summary text for unconfirmed receive operation with an alias (short version)',
    defaultMessage: 'Pending from {alias} ({address})'
  },
  summaryUnconfirmedReceiveLong: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-receive-long',
    description: 'Summary text for unconfirmed receive operation without an alias',
    defaultMessage: 'Pending transfer from {address}'
  },
  summaryUnconfirmedReceiveShort: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-receive-short',
    description:
      'Summary text for unconfirmed receive operation without an alias (short version)',
    defaultMessage: 'Pending from {address}'
  },
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
  summaryUnconfirmedSendAliasLong: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-send-alias-long',
    description: 'Summary text for unconfirmed send operation with an alias',
    defaultMessage: 'Pending transfer to {alias} ({address})'
  },
  summaryUnconfirmedSendAliasShort: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-send-alias-short',
    description:
      'Summary text for unconfirmed send operation with an alias (short version)',
    defaultMessage: 'Pending to {alias} ({address})'
  },
  summaryUnconfirmedSendLong: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-send-long',
    description: 'Summary text for unconfirmed send operation without an alias',
    defaultMessage: 'Pending transfer to {address}'
  },
  summaryUnconfirmedSendShort: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-send-short',
    description:
      'Summary text for unconfirmed send operation without an alias (short version)',
    defaultMessage: 'Pending to {address}'
  },
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
  },
  // passphrase
  summaryUnconfirmedPassphraseLong: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-passphrase-long',
    description: 'Summary text for unconfirmed passphrase tx',
    defaultMessage: 'Pending 2nd passphrase setup for the account'
  },
  summaryUnconfirmedPassphraseShort: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-passphrase-short',
    description: 'Summary text for unconfirmed passphrase tx (short version)',
    defaultMessage: 'Pending 2nd passphrase setup'
  },
  summaryPassphraseLong: {
    id: 'tx-details-expansion-panel.summary-passphrase-long',
    description: 'Summary text for passphrase tx',
    defaultMessage: 'Setup 2nd passphrase for the account'
  },
  summaryPassphraseShort: {
    id: 'tx-details-expansion-panel.summary-passphrase-short',
    description: 'Summary text for passphrase tx (short version)',
    defaultMessage: 'Setup 2nd passphrase'
  },
  // delegate
  summaryUnconfirmedDelegateLong: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-delegate-long',
    description: 'Summary text for unconfirmed delegate tx',
    defaultMessage: 'Pending delegate registration as {username}'
  },
  summaryUnconfirmedDelegateShort: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-delegate-short',
    description: 'Summary text for unconfirmed delegate tx (short version)',
    defaultMessage: 'Pending delegate reg. as {username}'
  },
  summaryUnconfirmedDelegateGenericLong: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-delegate-generic-long',
    description: 'Summary text for unconfirmed delegate tx (generic)',
    defaultMessage: 'Pending delegate registration transaction'
  },
  summaryUnconfirmedDelegateGenericShort: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-delegate-generic-short',
    description: 'Summary text for unconfirmed delegate tx (generic) (short version)',
    defaultMessage: 'Pending delegate reg. transaction'
  },
  summaryDelegateLong: {
    id: 'tx-details-expansion-panel.summary-delegate-long',
    description: 'Summary text for delegate tx',
    defaultMessage: 'Register as delegate {username}'
  },
  summaryDelegateShort: {
    id: 'tx-details-expansion-panel.summary-delegate-short',
    description: 'Summary text for delegate tx (short version)',
    defaultMessage: 'Register delegate {username}'
  },
  summaryDelegateGenericLong: {
    id: 'tx-details-expansion-panel.summary-delegate-generic-long',
    description: 'Summary text for delegate tx (generic)',
    defaultMessage: 'Register as a delegate transaction'
  },
  summaryDelegateGenericShort: {
    id: 'tx-details-expansion-panel.summary-delegate-generic-short',
    description:
      'Summary text for delegate tx (generic) (short version)',
    defaultMessage: 'Register delegate transaction'
  },
  // vote
  summaryUnconfirmedVoteCastLong: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-vote-cast-long',
    description: 'Summary text for unconfirmed cast vote tx',
    defaultMessage: 'Pending cast vote for {username} ({address})'
  },
  summaryUnconfirmedVoteCastShort: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-vote-cast-short',
    description: 'Summary text for unconfirmed cast vote tx (short version)',
    defaultMessage: 'Pending vote for {username} ({address})'
  },
  summaryUnconfirmedVoteRemoveLong: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-vote-remove-long',
    description: 'Summary text for unconfirmed remove vote tx',
    defaultMessage: 'Pending vote removal from {username} ({address})'
  },
  summaryUnconfirmedVoteRemoveShort: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-vote-remove-short',
    description: 'Summary text for unconfirmed remove vote tx (short version)',
    defaultMessage: 'Pending vote removal form {username} ({address})'
  },
  summaryUnconfirmedVoteGenericLong: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-vote-generic-long',
    description: 'Summary text for unconfirmed generic vote tx',
    defaultMessage: 'Pending vote transaction'
  },
  summaryUnconfirmedVoteGenericShort: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-vote-generic-short',
    description: 'Summary text for unconfirmed generic vote tx (short version)',
    defaultMessage: 'Pending vote transaction'
  },
  summaryVoteCastLong: {
    id: 'tx-details-expansion-panel.summary-vote-cast-long',
    description: 'Summary text for cast vote tx',
    defaultMessage: 'Cast vote for {username} ({address})'
  },
  summaryVoteCastShort: {
    id: 'tx-details-expansion-panel.summary-vote-cast-short',
    description: 'Summary text for cast vote tx (short version)',
    defaultMessage: 'Vote for {username} ({address})'
  },
  summaryVoteRemoveLong: {
    id: 'tx-details-expansion-panel.summary-vote-remove-long',
    description: 'Summary text for remove vote tx',
    defaultMessage: 'Remove vote from {username} ({address})'
  },
  summaryVoteRemoveShort: {
    id: 'tx-details-expansion-panel.summary-vote-remove-short',
    description: 'Summary text for remove vote tx (short version)',
    defaultMessage: 'Remove vote form {username} ({address})'
  },
  summaryVoteGenericLong: {
    id: 'tx-details-expansion-panel.summary-vote-generic-long',
    description: 'Summary text for generic vote tx',
    defaultMessage: 'Vote transaction'
  },
  summaryVoteGenericShort: {
    id: 'tx-details-expansion-panel.summary-vote-generic-short',
    description: 'Summary text for generic vote tx (short version)',
    defaultMessage: 'Vote transaction'
  },
  // unknown
  summaryUnconfirmedUnknownLong: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-unknown-long',
    description: 'Summary text for unconfirmed unknown tx',
    defaultMessage: 'Pending unknown transaction'
  },
  summaryUnconfirmedUnknownShort: {
    id: 'tx-details-expansion-panel.summary-unconfirmed-unknown-short',
    description: 'Summary text for unconfirmed unknown tx (short version)',
    defaultMessage: 'Pending unknown transaction'
  },
  summaryUnknownLong: {
    id: 'tx-details-expansion-panel.summary-unknown-long',
    description: 'Summary text for unknown tx',
    defaultMessage: 'Unknown transaction',
  },
  summaryUnknownShort: {
    id: 'tx-details-expansion-panel.summary-unknown-short',
    description: 'Summary text for unknown tx (short version)',
    defaultMessage: 'Unknown transaction'
  },
});

class TxDetailsExpansionPanel extends React.Component<DecoratedProps> {
  getSummary() {
    const { intl, tx } = this.props;

    let summaryShort = '',
      summaryLong = '';
    let amount = RawAmount.ZERO;

    const msgStatus = tx.confirmations < 1 ? 'Unconfirmed' : '';

    if (tx.type === TransactionType.SEND) {
      const data = tx.isIncoming ? {
        address: tx.senderId,
        alias: tx.senderName,
      } : {
        address: tx.recipientId,
        alias: tx.recipientName,
      };
      const msgAction = tx.isIncoming ? 'Receive' : 'Send';
      const msgAlias = !!data.alias ? 'Alias' : '';

      summaryLong = intl.formatMessage(messages[`summary${msgStatus}${msgAction}${msgAlias}Long`], data);
      summaryShort = intl.formatMessage(messages[`summary${msgStatus}${msgAction}${msgAlias}Short`], data);
    } else if (tx.type === TransactionType.SIGNATURE) {
      summaryLong = intl.formatMessage(messages[`summary${msgStatus}PassphraseLong`]);
      summaryShort = intl.formatMessage(messages[`summary${msgStatus}PassphraseShort`]);
    } else if (tx.type === TransactionType.DELEGATE) {
      const delegate = tx.asset && tx.asset.delegate;
      const username = delegate ? delegate.username : null;
      if (username) {
        const data = {
          username,
        };
        summaryLong = intl.formatMessage(messages[`summary${msgStatus}DelegateLong`], data);
        summaryShort = intl.formatMessage(messages[`summary${msgStatus}DelegateShort`], data);
      } else {
        summaryLong = intl.formatMessage(messages[`summary${msgStatus}PassphraseGenericLong`]);
        summaryShort = intl.formatMessage(messages[`summary${msgStatus}PassphraseGenericShort`]);
      }
    } else if (tx.type === TransactionType.VOTE) {
      const removedVotes = tx.votes
        .filter(({ op }) => op === 'remove')
        .map(({ delegate }) => delegate);
      const addedVotes = tx.votes
        .filter(({ op }) => op === 'add')
        .map(({ delegate }) => delegate);

      if (addedVotes.length > 0) {
        const data = {
          address: addedVotes[0].address,
          username: addedVotes[0].username,
        };
        summaryLong = intl.formatMessage(messages[`summary${msgStatus}VoteCastLong`], data);
        summaryShort = intl.formatMessage(messages[`summary${msgStatus}VoteCastShort`], data);
      } else if (removedVotes.length > 0) {
        const data = {
          address: removedVotes[0].address,
          username: removedVotes[0].username,
        };
        summaryLong = intl.formatMessage(messages[`summary${msgStatus}VoteRemoveLong`], data);
        summaryShort = intl.formatMessage(messages[`summary${msgStatus}VoteRemoveShort`], data);
      } else {
        summaryLong = intl.formatMessage(messages[`summary${msgStatus}VoteGenericLong`]);
        summaryShort = intl.formatMessage(messages[`summary${msgStatus}VoteGenericShort`]);
      }
    } else {
      summaryLong = intl.formatMessage(messages[`summary${msgStatus}UnknownLong`]);
      summaryShort = intl.formatMessage(messages[`summary${msgStatus}UnknownShort`]);
    }

    // Format amount
    if (tx.isIncoming) {
      amount = tx.amountFee;
    } else {
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
