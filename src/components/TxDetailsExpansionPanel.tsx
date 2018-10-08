import { Omit } from '@material-ui/core';
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
import * as moment from 'moment/min/moment-with-locales';
import * as React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import Link from './Link';
import { TTransaction } from '../stores/wallet';
import { RawAmount } from '../utils/amounts';
import { copyToClipboard } from '../utils/clipboard';
import { PropsOf } from '../utils/metaTypes';

type LinkProps = Omit<PropsOf<typeof Link>, 'children'>;

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
        flexWrap: 'wrap'
      },
      '&:nth-child(even)': {
        backgroundColor: '#fafafa'
      }
    },
    detailsRowLabel: {
      ...theme.typography.body2,
      order: 1,
      lineHeight: '28px',
      [theme.breakpoints.down('xs')]: {
        flex: 1
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
        marginLeft: 0
      }
    },
    detailsRowActions: {
      order: 3,
      minWidth: 2 * 28,
      marginLeft: theme.spacing.unit,
      [theme.breakpoints.down('xs')]: {
        order: 2
      }
    },
    detailsRowAction: {
      width: 28,
      height: 28,
      fontSize: theme.typography.pxToRem(14)
    }
  });
};

interface Props extends WithStyles<typeof styles> {
  tx: TTransaction;
  explorerUrl: string;
  getSendLinkProps: (address: string, amount: RawAmount) => LinkProps;
  handleContactEdit(id: string): void;
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
    description:
      'Summary text for unconfirmed receive operation without an alias',
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
    description:
      'Summary text for unconfirmed delegate tx (generic) (short version)',
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
    description: 'Summary text for delegate tx (generic) (short version)',
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
    defaultMessage: 'Unknown transaction'
  },
  summaryUnknownShort: {
    id: 'tx-details-expansion-panel.summary-unknown-short',
    description: 'Summary text for unknown tx (short version)',
    defaultMessage: 'Unknown transaction'
  },
  /// details
  detailsStatusLabel: {
    id: 'tx-details-expansion-panel.details-status-label',
    description: 'Tx details status row label',
    defaultMessage: 'Status:'
  },
  detailsStatusUnconfirmed: {
    id: 'tx-details-expansion-panel.details-status-unconfirmed',
    description: 'Tx details unconfirmed status value',
    defaultMessage: 'Unconfirmed'
  },
  detailsStatusUnconfirmedTooltip: {
    id: 'tx-details-expansion-panel.details-status-unconfirmed-tooltip',
    description: 'Tx details unconfirmed status tooltip',
    defaultMessage: 'Not included in a block yet'
  },
  detailsStatusUnsettled: {
    id: 'tx-details-expansion-panel.details-status-unsettled',
    description: 'Tx details confirmed but unsettled status value',
    defaultMessage: 'Confirmed (settling - {confirmations}/{needed})'
  },
  detailsStatusUnsettledTooltip: {
    id: 'tx-details-expansion-panel.details-status-unsettled-tooltip',
    description: 'Tx details confirmed but unsettled status tooltip',
    defaultMessage: 'With low number of confirmations'
  },
  detailsStatusSettled: {
    id: 'tx-details-expansion-panel.details-status-settled',
    description: 'Tx details confirmed and settled status value',
    defaultMessage: 'Confirmed (settled)'
  },
  detailsStatusSettledTooltip: {
    id: 'tx-details-expansion-panel.details-status-settled-tooltip',
    description: 'Tx details confirmed and settled status tooltip',
    defaultMessage: 'With high number of confirmations'
  },
  detailsTimestampLabel: {
    id: 'tx-details-expansion-panel.details-timestamp-label',
    description: 'Tx details timestamp row label',
    defaultMessage: 'Timestamp:'
  },
  detailsTxIdLabel: {
    id: 'tx-details-expansion-panel.details-txid-label',
    description: 'Tx details transaction id row label',
    defaultMessage: 'Transaction ID:'
  },
  detailsTxIdCopyTooltip: {
    id: 'tx-details-expansion-panel.details-txid-copy-tooltip',
    description: 'Tx details transaction id copy tooltip',
    defaultMessage: 'Copy ID'
  },
  detailsTxIdCopyAria: {
    id: 'tx-details-expansion-panel.details-txid-copy-aria',
    description: 'Tx details transaction id copy aria label',
    defaultMessage: 'Copy transaction ID'
  },
  detailsTxIdExplorerTooltip: {
    id: 'tx-details-expansion-panel.details-txid-explorer-tooltip',
    description: 'Tx details transaction id open explorer tooltip',
    defaultMessage: 'View in explorer'
  },
  detailsTxIdExplorerAria: {
    id: 'tx-details-expansion-panel.details-txid-explorer-aria',
    description: 'Tx details transaction id open explorer aria label',
    defaultMessage: 'View transaction in explorer'
  },
  detailsBlockIdLabel: {
    id: 'tx-details-expansion-panel.details-blockid-label',
    description: 'Tx details transaction block id row label',
    defaultMessage: 'Block ID:'
  },
  detailsBlockIdCopyTooltip: {
    id: 'tx-details-expansion-panel.details-blockid-copy-tooltip',
    description: 'Tx details transaction block id copy tooltip',
    defaultMessage: 'Copy ID'
  },
  detailsBlockIdCopyAria: {
    id: 'tx-details-expansion-panel.details-blockid-copy-aria',
    description: 'Tx details transaction block id copy aria label',
    defaultMessage: 'Copy block ID'
  },
  detailsBlockIdExplorerTooltip: {
    id: 'tx-details-expansion-panel.details-blockid-explorer-tooltip',
    description: 'Tx details transaction block id open explorer tooltip',
    defaultMessage: 'View in explorer'
  },
  detailsBlockIdExplorerAria: {
    id: 'tx-details-expansion-panel.details-blockid-explorer-aria',
    description: 'Tx details transaction block id open explorer aria label',
    defaultMessage: 'View block in explorer'
  },
  detailsTxTypeLabel: {
    id: 'tx-details-expansion-panel.details-txtype-label',
    description: 'Tx details transaction type row label',
    defaultMessage: 'Transaction type:'
  },
  detailsTxTypeSend: {
    id: 'tx-details-expansion-panel.details-txtype-send',
    description: 'Tx details transaction type send value',
    defaultMessage: 'Send'
  },
  detailsTxTypeVote: {
    id: 'tx-details-expansion-panel.details-txtype-vote',
    description: 'Tx details transaction type vote value',
    defaultMessage: 'Vote'
  },
  detailsTxTypePassphrase: {
    id: 'tx-details-expansion-panel.details-txtype-passphrase',
    description: 'Tx details transaction type passphrase value',
    defaultMessage: '2nd passphrase'
  },
  detailsTxTypeDelegate: {
    id: 'tx-details-expansion-panel.details-txtype-delegate',
    description: 'Tx details transaction type delegate value',
    defaultMessage: 'Delegate registration'
  },
  detailsTxTypeUnknown: {
    id: 'tx-details-expansion-panel.details-txtype-unknown',
    description: 'Tx details transaction type unknown value',
    defaultMessage: 'Unknown'
  },
  detailsAddressAlias: {
    id: 'tx-details-expansion-panel.details-address-alias-format',
    description: 'Tx details address with alias format',
    defaultMessage: '{alias} ({address})'
  },
  detailsAddress: {
    id: 'tx-details-expansion-panel.details-address-format',
    description: 'Tx details address without alias format',
    defaultMessage: '{address}'
  },
  detailsSenderLabel: {
    id: 'tx-details-expansion-panel.details-sender-label',
    description: 'Tx details sender row label',
    defaultMessage: 'Sender:'
  },
  detailsSenderCopyTooltip: {
    id: 'tx-details-expansion-panel.details-sender-copy-tooltip',
    description: 'Tx details sender copy tooltip',
    defaultMessage: 'Copy address'
  },
  detailsSenderCopyAria: {
    id: 'tx-details-expansion-panel.details-sender-copy-aria',
    description: 'Tx details sender copy aria label',
    defaultMessage: 'Copy sender address'
  },
  detailsSenderAddTooltip: {
    id: 'tx-details-expansion-panel.details-sender-add-tooltip',
    description: 'Tx details sender open explorer tooltip',
    defaultMessage: 'Add contact'
  },
  detailsSenderAddAria: {
    id: 'tx-details-expansion-panel.details-sender-add-aria',
    description: 'Tx details sender open explorer aria label',
    defaultMessage: 'Add sender to contacts'
  },
  detailsSenderEditTooltip: {
    id: 'tx-details-expansion-panel.details-sender-edit-tooltip',
    description: 'Tx details sender open explorer tooltip',
    defaultMessage: 'Edit contact'
  },
  detailsSenderEditAria: {
    id: 'tx-details-expansion-panel.details-sender-edit-aria',
    description: 'Tx details sender open explorer aria label',
    defaultMessage: 'Edit sender contact card'
  },
  detailsRecipientLabel: {
    id: 'tx-details-expansion-panel.details-recipient-label',
    description: 'Tx details recipient row label',
    defaultMessage: 'Recipient:'
  },
  detailsRecipientCopyTooltip: {
    id: 'tx-details-expansion-panel.details-recipient-copy-tooltip',
    description: 'Tx details recipient copy tooltip',
    defaultMessage: 'Copy address'
  },
  detailsRecipientCopyAria: {
    id: 'tx-details-expansion-panel.details-recipient-copy-aria',
    description: 'Tx details recipient copy aria label',
    defaultMessage: 'Copy recipient address'
  },
  detailsRecipientAddTooltip: {
    id: 'tx-details-expansion-panel.details-recipient-add-tooltip',
    description: 'Tx details recipient open explorer tooltip',
    defaultMessage: 'Add contact'
  },
  detailsRecipientAddAria: {
    id: 'tx-details-expansion-panel.details-recipient-add-aria',
    description: 'Tx details recipient open explorer aria label',
    defaultMessage: 'Add recipient to contacts'
  },
  detailsRecipientEditTooltip: {
    id: 'tx-details-expansion-panel.details-recipient-edit-tooltip',
    description: 'Tx details recipient open explorer tooltip',
    defaultMessage: 'Edit contact'
  },
  detailsRecipientEditAria: {
    id: 'tx-details-expansion-panel.details-recipient-edit-aria',
    description: 'Tx details recipient open explorer aria label',
    defaultMessage: 'Edit recipient contact card'
  },
  detailsSendAmountLabel: {
    id: 'tx-details-expansion-panel.details-send-amount-label',
    description: 'Tx details send amount row label',
    defaultMessage: 'Send amount:'
  },
  detailsDelegateUsernameLabel: {
    id: 'tx-details-expansion-panel.details-delegate-username-label',
    description: 'Tx details delegate username row label',
    defaultMessage: 'Registered username:'
  },
  detailsVotesAddedLabel: {
    id: 'tx-details-expansion-panel.details-votes-added-label',
    description: 'Tx details votes added row label',
    defaultMessage:
      '{voteCount, plural,' + '  one {Vote}' + '  other {Votes}' + '} added:'
  },
  detailsVotesRemovedLabel: {
    id: 'tx-details-expansion-panel.details-votes-removed-label',
    description: 'Tx details votes removed row label',
    defaultMessage:
      '{voteCount, plural,' + '  one {Vote}' + '  other {Votes}' + '} removed:'
  },
  detailsNetworkFeeLabel: {
    id: 'tx-details-expansion-panel.details-network-fee-label',
    description: 'Tx details network fee row label',
    defaultMessage: 'Network fee:'
  },
  detailsReturnFundsLabel: {
    id: 'tx-details-expansion-panel.details-return-funds-label',
    description: 'Tx details return funds button label',
    defaultMessage: 'Return funds'
  },
  detailsSendAgainLabel: {
    id: 'tx-details-expansion-panel.details-send-again-label',
    description: 'Tx details send again button label',
    defaultMessage: 'Send again'
  }
});

class TxDetailsExpansionPanel extends React.Component<DecoratedProps> {
  getSummary() {
    const { intl, tx } = this.props;

    let summaryShort = '',
      summaryLong = '';
    let amount = RawAmount.ZERO;

    const msgStatus = tx.confirmations >= 1 ? '' : 'Unconfirmed';

    if (tx.type === TransactionType.SEND) {
      const data = tx.isIncoming
        ? {
            address: tx.senderId,
            alias: tx.senderName
          }
        : {
            address: tx.recipientId,
            alias: tx.recipientName
          };
      const msgAction = tx.isIncoming ? 'Receive' : 'Send';
      const msgAlias = !!data.alias ? 'Alias' : '';

      summaryLong = intl.formatMessage(
        messages[`summary${msgStatus}${msgAction}${msgAlias}Long`],
        data
      );
      summaryShort = intl.formatMessage(
        messages[`summary${msgStatus}${msgAction}${msgAlias}Short`],
        data
      );
    } else if (tx.type === TransactionType.SIGNATURE) {
      summaryLong = intl.formatMessage(
        messages[`summary${msgStatus}PassphraseLong`]
      );
      summaryShort = intl.formatMessage(
        messages[`summary${msgStatus}PassphraseShort`]
      );
    } else if (tx.type === TransactionType.DELEGATE) {
      const delegate = tx.asset && tx.asset.delegate;
      const username = delegate ? delegate.username : null;
      if (username) {
        const data = {
          username
        };
        summaryLong = intl.formatMessage(
          messages[`summary${msgStatus}DelegateLong`],
          data
        );
        summaryShort = intl.formatMessage(
          messages[`summary${msgStatus}DelegateShort`],
          data
        );
      } else {
        summaryLong = intl.formatMessage(
          messages[`summary${msgStatus}PassphraseGenericLong`]
        );
        summaryShort = intl.formatMessage(
          messages[`summary${msgStatus}PassphraseGenericShort`]
        );
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
          username: addedVotes[0].username
        };
        summaryLong = intl.formatMessage(
          messages[`summary${msgStatus}VoteCastLong`],
          data
        );
        summaryShort = intl.formatMessage(
          messages[`summary${msgStatus}VoteCastShort`],
          data
        );
      } else if (removedVotes.length > 0) {
        const data = {
          address: removedVotes[0].address,
          username: removedVotes[0].username
        };
        summaryLong = intl.formatMessage(
          messages[`summary${msgStatus}VoteRemoveLong`],
          data
        );
        summaryShort = intl.formatMessage(
          messages[`summary${msgStatus}VoteRemoveShort`],
          data
        );
      } else {
        summaryLong = intl.formatMessage(
          messages[`summary${msgStatus}VoteGenericLong`]
        );
        summaryShort = intl.formatMessage(
          messages[`summary${msgStatus}VoteGenericShort`]
        );
      }
    } else {
      summaryLong = intl.formatMessage(
        messages[`summary${msgStatus}UnknownLong`]
      );
      summaryShort = intl.formatMessage(
        messages[`summary${msgStatus}UnknownShort`]
      );
    }

    // Format amount
    if (tx.isIncoming) {
      amount = tx.amount;
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
    const { intl, classes, tx, explorerUrl, getSendLinkProps } = this.props;

    const {
      summaryShort,
      summaryLong,
      amount,
      amountLong,
      amountShort
    } = this.getSummary();

    const timestamp = moment.utc(tx.timestamp).local().toDate();

    const removedVotes = (tx.votes || [])
      .filter(({ op }) => op === 'remove')
      .map(({ delegate }) => delegate);
    const addedVotes = (tx.votes || [])
      .filter(({ op }) => op === 'add')
      .map(({ delegate }) => delegate);

    // shortcuts
    const fmt = intl.formatMessage.bind(intl);
    const msg = messages;

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
          {/* STATUS */}
          <Typography className={classes.detailsRow}>
            <span
              className={classes.detailsRowLabel}
              children={fmt(msg.detailsStatusLabel)}
            />
            <span className={classes.detailsRowValue}>
              {tx.confirmations >= 101 ? (
                <Tooltip title={fmt(msg.detailsStatusSettledTooltip)}>
                  <span children={fmt(msg.detailsStatusSettled)} />
                </Tooltip>
              ) : tx.confirmations >= 1 ? (
                <Tooltip title={fmt(msg.detailsStatusUnsettledTooltip)}>
                  <span
                    children={fmt(msg.detailsStatusUnsettled, {
                      confirmations: tx.confirmations,
                      needed: 101
                    })}
                  />
                </Tooltip>
              ) : (
                <Tooltip title={fmt(msg.detailsStatusUnconfirmedTooltip)}>
                  <span children={fmt(msg.detailsStatusUnconfirmed)} />
                </Tooltip>
              )}
            </span>
            <span className={classes.detailsRowActions} />
          </Typography>
          {/* TIMESTAMP */}
          <Typography className={classes.detailsRow}>
            <span
              className={classes.detailsRowLabel}
              children={fmt(msg.detailsTimestampLabel)}
            />
            <time
              className={classes.detailsRowValue}
              dateTime={timestamp.toISOString()}
            >
              {`${intl.formatDate(timestamp)} ${intl.formatTime(timestamp)}`}
            </time>
            <span className={classes.detailsRowActions} />
          </Typography>
          {/* TX ID */}
          <Typography className={classes.detailsRow}>
            <span
              className={classes.detailsRowLabel}
              children={fmt(msg.detailsTxIdLabel)}
            />
            <span className={classes.detailsRowValue} children={tx.id} />
            <span className={classes.detailsRowActions}>
              <Tooltip title={fmt(msg.detailsTxIdCopyTooltip)}>
                <IconButton
                  className={classes.detailsRowAction}
                  aria-label={fmt(msg.detailsTxIdCopyAria)}
                  onClick={this.handleCopyTxId}
                >
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title={fmt(msg.detailsTxIdExplorerTooltip)}>
                <IconButton
                  className={classes.detailsRowAction}
                  component="a"
                  href={`${explorerUrl}/tx/${tx.id}`}
                  target="_blank"
                  aria-label={fmt(msg.detailsTxIdExplorerAria)}
                >
                  <LinkIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </span>
          </Typography>
          {/* BLOCK ID */}
          {tx.confirmations >= 1 && (
            <Typography className={classes.detailsRow}>
              <span
                className={classes.detailsRowLabel}
                children={fmt(msg.detailsBlockIdLabel)}
              />
              <span className={classes.detailsRowValue} children={tx.blockId} />
              <span className={classes.detailsRowActions}>
                <Tooltip title={fmt(msg.detailsBlockIdCopyTooltip)}>
                  <IconButton
                    className={classes.detailsRowAction}
                    aria-label={fmt(msg.detailsBlockIdCopyAria)}
                    onClick={this.handleCopyBlockId}
                  >
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={fmt(msg.detailsBlockIdExplorerTooltip)}>
                  <IconButton
                    className={classes.detailsRowAction}
                    component="a"
                    href={`${explorerUrl}/block/${tx.blockId}`}
                    target="_blank"
                    aria-label={fmt(msg.detailsBlockIdExplorerAria)}
                  >
                    <LinkIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </span>
            </Typography>
          )}
          {/* TYPE */}
          <Typography className={classes.detailsRow}>
            <span
              className={classes.detailsRowLabel}
              children={fmt(msg.detailsTxTypeLabel)}
            />
            <span
              className={classes.detailsRowValue}
              children={fmt(
                tx.type === TransactionType.SEND
                  ? msg.detailsTxTypeSend
                  : tx.type === TransactionType.VOTE
                    ? msg.detailsTxTypeVote
                    : tx.type === TransactionType.SIGNATURE
                      ? msg.detailsTxTypePassphrase
                      : tx.type === TransactionType.DELEGATE
                        ? msg.detailsTxTypeDelegate
                        : msg.detailsTxTypeUnknown
              )}
            />
            <span className={classes.detailsRowActions} />
          </Typography>
          {/* SENDER */}
          {tx.type === TransactionType.SEND &&
            this.renderContact(
              tx.senderId,
              tx.senderName,
              true,
              !tx.isIncoming
            )}
          {/* RECIPIENT */}
          {tx.type === TransactionType.SEND &&
            this.renderContact(
              tx.recipientId,
              tx.recipientName,
              false,
              tx.isIncoming
            )}
          {/* SEND INFO (AMOUNT) */}
          {tx.type === TransactionType.SEND && (
            <Typography className={classes.detailsRow}>
              <span
                className={classes.detailsRowLabel}
                children={fmt(msg.detailsSendAmountLabel)}
              />
              <span className={classes.detailsRowValue}>
                {intl.formatNumber(tx.amount.unit.toNumber(), {
                  style: 'decimal'
                })}{' '}
                RISE
              </span>
              <span className={classes.detailsRowActions} />
            </Typography>
          )}
          {/* DELEGATE INFO */}
          {tx.type === TransactionType.DELEGATE && (
            <Typography className={classes.detailsRow}>
              <span
                className={classes.detailsRowLabel}
                children={fmt(msg.detailsDelegateUsernameLabel)}
              />
              <span
                className={classes.detailsRowValue}
                children={tx.asset.delegate ? tx.asset.delegate.username : ''}
              />
              <span className={classes.detailsRowActions} />
            </Typography>
          )}
          {/* VOTE INFO */}
          {removedVotes.length > 0 && (
            <Typography className={classes.detailsRow}>
              <span
                className={classes.detailsRowLabel}
                children={fmt(msg.detailsVotesRemovedLabel, {
                  voteCount: removedVotes.length
                })}
              />
              <span
                className={classes.detailsRowValue}
                children={removedVotes
                  .map(d => d.username)
                  .reduce(
                    (a, u) => a.concat(a.length ? ', ' : null, u),
                    [] as Array<null | string>
                  )}
              />
              <span className={classes.detailsRowActions} />
            </Typography>
          )}
          {/* VOTE INFO */}
          {addedVotes.length > 0 && (
            <Typography className={classes.detailsRow}>
              <span
                className={classes.detailsRowLabel}
                children={fmt(msg.detailsVotesAddedLabel, {
                  voteCount: addedVotes.length
                })}
              />
              <span
                className={classes.detailsRowValue}
                children={addedVotes
                  .map(d => d.username)
                  .reduce(
                    (a, u) => a.concat(a.length ? ', ' : null, u),
                    [] as Array<null | string>
                  )}
              />
              <span className={classes.detailsRowActions} />
            </Typography>
          )}
          {/* FEE */}
          <Typography className={classes.detailsRow}>
            <span
              className={classes.detailsRowLabel}
              children={fmt(msg.detailsNetworkFeeLabel)}
            />
            <span className={classes.detailsRowValue}>
              {intl.formatNumber(tx.fee.unit.toNumber(), {
                style: 'decimal'
              })}{' '}
              RISE
            </span>
            <span className={classes.detailsRowActions} />
          </Typography>
        </ExpansionPanelDetails>
        {/* BUTTONS */}
        <ExpansionPanelActions>
          {tx.type === TransactionType.SEND &&
            tx.isIncoming && (
              <Link {...getSendLinkProps(tx.senderId, tx.amount)}>
                <Button
                  size="small"
                  children={fmt(msg.detailsReturnFundsLabel)}
                />
              </Link>
            )}
          {tx.type === TransactionType.SEND &&
            !tx.isIncoming && (
              <Link {...getSendLinkProps(tx.recipientId, tx.amount)}>
                <Button
                  size="small"
                  children={fmt(msg.detailsSendAgainLabel)}
                />
              </Link>
            )}
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

  /**
   * Renders a contact entry, linked to the name edit dialog.
   *
   * @param id
   * @param name
   * @param sender This contact initiated the transaction.
   * @param ownAccount
   */
  renderContact(
    id: string,
    name: string | null,
    sender: boolean,
    ownAccount: boolean
  ) {
    const { intl, classes, handleContactEdit } = this.props;

    // shortcuts
    const fmt = intl.formatMessage.bind(intl);
    const msg = messages;

    const ContactIcon = name ? PersonIcon : PersonAddIcon;

    return (
      <Typography className={classes.detailsRow}>
        <span
          className={classes.detailsRowLabel}
          children={fmt(
            sender ? msg.detailsSenderLabel : msg.detailsRecipientLabel
          )}
        />
        <span
          className={classes.detailsRowValue}
          children={fmt(name ? msg.detailsAddressAlias : msg.detailsAddress, {
            alias: name,
            address: id
          })}
        />
        <span className={classes.detailsRowActions}>
          <Tooltip title={fmt(msg.detailsSenderCopyTooltip)}>
            <IconButton
              className={classes.detailsRowAction}
              aria-label={fmt(msg.detailsSenderCopyAria)}
              onClick={() => copyToClipboard(id)}
            >
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={fmt(
              sender
                ? name
                  ? msg.detailsSenderEditTooltip
                  : msg.detailsSenderAddTooltip
                : name
                  ? msg.detailsRecipientEditTooltip
                  : msg.detailsRecipientAddTooltip
            )}
          >
            <IconButton
              className={classes.detailsRowAction}
              aria-label={fmt(
                sender
                  ? name
                    ? msg.detailsSenderEditAria
                    : msg.detailsSenderAddAria
                  : name
                    ? msg.detailsRecipientEditAria
                    : msg.detailsRecipientAddAria
              )}
              onClick={() => handleContactEdit(id)}
            >
              <ContactIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </span>
      </Typography>
    );
  }
}

export default stylesDecorator(injectIntl(TxDetailsExpansionPanel));
