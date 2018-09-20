import Button from '@material-ui/core/Button';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import SendIcon from '@material-ui/icons/Send';
import { toPairs } from 'lodash';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as classNames from 'classnames';
import * as React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import { RawAmount } from '../../utils/amounts';
import SendCoinsDialog from './SendCoinsDialog';
import AccountOverviewHeader from '../../components/AccountOverviewHeader';
import TxDetailsExpansionPanel from '../../components/TxDetailsExpansionPanel';
import { accountOverviewRoute, accountSendRoute } from '../../routes';
import { accountStore } from '../../stores';
import AccountStore from '../../stores/account';
import WalletStore from '../../stores/wallet';

const styles = (theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
      flexDirection: 'column',
      // Override the overflow setting from `.Wallet-content > :last-child`
      overflow: 'visible !important'
    },
    header: {
      zIndex: 100
    },
    headerFixed: {
      flexShrink: 0,
      [theme.breakpoints.down('xs')]: {
        display: 'none'
      }
    },
    headerInline: {
      [theme.breakpoints.up('sm')]: {
        display: 'none'
      }
    },
    content: {
      padding: theme.spacing.unit * 2,
      overflow: 'auto',
      zIndex: 50
    },
    fab: {
      position: 'fixed',
      right: 3 * theme.spacing.unit,
      bottom: 3 * theme.spacing.unit,
      zIndex: 1100
    },
    dateGroupTitle: {
      marginTop: theme.spacing.unit * 2,
      marginBottom: theme.spacing.unit,
      ['&:first-child']: {
        marginTop: 0
      }
    },
    loadMore: {
      textAlign: 'center',
      marginTop: 10
    }
  });

interface Props extends WithStyles<typeof styles> {
  account?: AccountStore;
}

interface PropsInjected extends Props {
  accountStore: AccountStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'AccountOverview' });

const messages = defineMessages({
  unnamedAccountLabel: {
    id: 'wallet-account-overview.unnamed-account-label',
    description: 'Label for accounts that user hasn\'t named yet',
    defaultMessage: 'Unnamed account'
  },
  sendFabTooltip: {
    id: 'wallet-account-overview.send-funds-fab-tooltip',
    description: 'Tooltip for send floating action button',
    defaultMessage: 'Send RISE'
  }
});

@inject(accountStore)
@inject('routerStore')
@inject('walletStore')
@observer
class AccountOverview extends React.Component<DecoratedProps> {
  get injected(): PropsInjected & DecoratedProps {
    // @ts-ignore
    return this.props;
  }

  get account() {
    return this.injected.account || this.injected.accountStore;
  }

  handleSendClick = () => {
    this.injected.routerStore.goTo(accountSendRoute, { id: this.account.id });
  }

  handleNavigateBack = () => {
    this.injected.routerStore.goTo(accountOverviewRoute, {
      id: this.account.id
    });
  }

  handleLoadMore = () => {
    this.account.recentTransactions.loadMore(this.injected.walletStore);
  }

  goToSendCoins = (address: string, amount: RawAmount) => {
    this.injected.routerStore.goTo(
      accountSendRoute,
      {
        id: this.account.id
      },
      null,
      {
        address,
        amount: amount.unit.toString()
      }
    );
  }

  render() {
    // mark the current account as viewed
    this.account.viewed = true;
    const { intl, classes, walletStore } = this.injected;
    const unnamedAccountLabel = intl.formatMessage(
      messages.unnamedAccountLabel
    );

    const readOnly = this.account && this.account.readOnly;
    const headerProps = {
      address: this.account.id,
      alias: this.account.name || unnamedAccountLabel,
      balance: this.account.balance,
      balance_in_fiat: this.account.balanceFiat || ''
    };

    const recentTransactions = this.account.recentTransactions;

    return (
      <div className={classes.container}>
        <AccountOverviewHeader
          className={classNames(classes.header, classes.headerFixed)}
          {...headerProps}
        />
        {!readOnly && (
          <Tooltip
            placement="left"
            title={intl.formatMessage(messages.sendFabTooltip)}
          >
            <Button
              variant="fab"
              className={classes.fab}
              color="secondary"
              onClick={this.handleSendClick}
            >
              <SendIcon />
            </Button>
          </Tooltip>
        )}
        <SendCoinsDialog
          account={this.account}
          onNavigateBack={this.handleNavigateBack}
        />
        <div className={classes.content}>
          <AccountOverviewHeader
            key="__header__"
            className={classNames(classes.header, classes.headerInline)}
            {...headerProps}
          />
          {toPairs(recentTransactions.groupedByDay).map(
            ([group, transactions]) => (
              <React.Fragment key={`${this.account.id}-${group}`}>
                <Typography
                  className={classes.dateGroupTitle}
                  variant="body2"
                  color="textSecondary"
                >
                  {group}
                </Typography>
                <div>
                  {transactions.map(transaction => {
                    // make sure the transaction data has up to dane names
                    // TODO move this to a getter (create a Transaction class)
                    transaction.senderName = walletStore.idToName(
                      transaction.senderId
                    );
                    transaction.recipientName = walletStore.getRecipientName(
                      transaction.type,
                      transaction.recipientId
                    );
                    return (
                      <TxDetailsExpansionPanel
                        goToSendCoins={this.goToSendCoins}
                        key={transaction.id}
                        tx={transaction}
                        explorerUrl={this.account.config.explorer_url}
                      />
                    );
                  })}
                </div>
              </React.Fragment>
            )
          )}
          {recentTransactions.items.length >= 8 && (
            <div className={classes.loadMore}>
              <Button
                disabled={recentTransactions.isLoading}
                onClick={this.handleLoadMore}
              >
                Load more
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default stylesDecorator(injectIntl(AccountOverview));
