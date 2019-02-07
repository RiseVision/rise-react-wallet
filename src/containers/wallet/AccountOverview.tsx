import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';
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
import { action, runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as classNames from 'classnames';
import * as React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import { RouteLink } from '../../stores/root';
import { RawAmount } from '../../utils/amounts';
import AccountNameDialog from './AccountNameDialog';
import CreateContactDialog from './CreateContactDialog';
import ModifyContactDialog from './ModifyContactDialog';
import SendCoinsDialog from './SendCoinsDialog';
import AccountOverviewHeader from '../../components/AccountOverviewHeader';
import AccountTip from '../../components/AccountTip';
import TxDetailsExpansionPanel from '../../components/TxDetailsExpansionPanel';
import LoadingIndicator from '../../components/LoadingIndicator';
import Link from '../../components/Link';
import { accountOverviewRoute, accountSendRoute } from '../../routes';
import { accountStore } from '../../stores';
import AccountStore, { AccountType, LoadingState } from '../../stores/account';
import AddressBookStore from '../../stores/addressBook';
import WalletStore from '../../stores/wallet';

const HIGH_VALUE_ACCOUNT_THRESHOLD = RawAmount.fromUnit(1000);

const styles = (theme: Theme) =>
  createStyles({
    container: {
      position: 'relative',
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
      marginBottom: theme.spacing.unit * 2,
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
      },
      ...theme.typography.body2,
      color: theme.palette.text.secondary,
      fontWeight: 500
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
  addressBookStore: AddressBookStore;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'AccountOverview' });

const messages = defineMessages({
  unnamedAccountLabel: {
    id: 'wallet-account-overview.unnamed-account-label',
    description: 'Label for accounts that user hasn\'t named yet',
    defaultMessage: 'Unnamed account ({id})'
  },
  noPubkeyAccountTip: {
    id: 'wallet-account-overview.no-pubkey-account-tip',
    description:
      'Tip about increasing the security of the account by making a transaction',
    defaultMessage:
      'You should make a transaction (send some RISE or cast a vote) to bind ' +
      'your public key with this account to incrase the security of your funds.'
  },
  highValueAccountTip: {
    id: 'wallet-account-overview.high-value-account-tip',
    description:
      'Tip about using more secure ways to store RISE for high value accounts',
    defaultMessage:
      'You have quite a few RISE in this account. You should consider using a ' +
      'hardware wallet for added security. If that is not an option, at the very ' +
      'least you should start using the RISE desktop application instead of the ' +
      'web app.'
  },
  sendFabTooltip: {
    id: 'wallet-account-overview.send-funds-fab-tooltip',
    description: 'Tooltip for send floating action button',
    defaultMessage: 'Send RISE'
  }
});

type State = {
  editContactID: string | null;
};

@inject(accountStore)
@inject('routerStore')
@inject('walletStore')
@inject('addressBookStore')
@observer
class AccountOverview extends React.Component<DecoratedProps, State> {
  state: State = {
    editContactID: null
  };

  get injected(): PropsInjected & DecoratedProps {
    // @ts-ignore
    return this.props;
  }

  get account() {
    return this.injected.account || this.injected.accountStore;
  }

  handleNavigateBack = () => {
    this.injected.routerStore.goTo(accountOverviewRoute, {
      id: this.account.id
    });
  }

  handleLoadMore = () => {
    this.account.recentTransactions.loadMore();
  }

  handleContactEdit = (id: string) => {
    this.setState({ editContactID: id });
  }

  renderContactDialog = () => {
    const {
      walletStore: wallet,
      addressBookStore: addressBook
    } = this.injected;
    const { editContactID: id } = this.state;

    const backLink: RouteLink = {
      route: accountOverviewRoute,
      params: {
        id: this.account.id
      },
      onBeforeNavigate: () => {
        this.setState({
          editContactID: null
        });
      }
    };

    let showAccountName = false;
    let showCreateContact = false;
    let showModifyContact = false;

    if (!id) {
      // No-op on purpose
    } else if (wallet.accounts.has(id)) {
      showAccountName = true;
    } else if (addressBook.contacts.has(id)) {
      showModifyContact = true;
    } else {
      showCreateContact = true;
    }

    return (
      <React.Fragment>
        <AccountNameDialog
          // @ts-ignore TODO avoid rendering data-less dialogs
          account={wallet.accounts.get(id) || { id: '', name: '' }}
          navigateBackLink={backLink}
          open={showAccountName}
        />
        <CreateContactDialog
          navigateBackLink={backLink}
          address={id || ''}
          open={showCreateContact}
        />
        <ModifyContactDialog
          navigateBackLink={backLink}
          address={id || ''}
          open={showModifyContact}
        />
      </React.Fragment>
    );
  }

  getSendLinkProps = (address: string, amount: RawAmount) => {
    return {
      route: accountSendRoute,
      params: {
        id: this.account.id
      },
      queryParams: {
        address,
        amount: amount.unit.toString()
      }
    };
  }

  @action
  handleExpand = (id: string, expanded: boolean) => {
    const account = this.account;
    if (expanded) {
      account.recentTransactions.expanded.push(id);
    } else {
      account.recentTransactions.expanded.remove(id);
    }
  }

  render() {
    const { intl, classes, walletStore } = this.injected;

    // mark the current account as visible and umark others
    for (const account of walletStore.accounts.values()) {
      runInAction(() => {
        account.visible = account.id === this.account.id;
      });
    }

    const readOnly = this.account && this.account.type === AccountType.READONLY;
    const headerProps = {
      address: this.account.id,
      alias:
        this.account.name ||
        intl.formatMessage(messages.unnamedAccountLabel, {
          id: this.account.localId
        }),
      balance: this.account.balance,
      balanceFiat: this.account.balanceFiat,
      fiatCurrency: this.account.fiatCurrency
    };

    const recentTransactions = this.account.recentTransactions;

    return (
      <div className={classes.container}>
        {this.renderContactDialog()}
        <AccountOverviewHeader
          className={classNames(classes.header, classes.headerFixed)}
          {...headerProps}
        />
        {!readOnly && (
          <Tooltip
            placement="left"
            title={intl.formatMessage(messages.sendFabTooltip)}
          >
            <Link
              route={accountSendRoute}
              params={{
                id: this.account.id
              }}
            >
              <Fab classes={{ root: classes.fab }} color="secondary">
                <SendIcon />
              </Fab>
            </Link>
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
          <AccountTip
            key="__no_pubkey_tip__"
            open={
              this.account.balance.gt(RawAmount.ZERO) &&
              !this.account.broadcastedPublicKey
            }
            message={intl.formatMessage(messages.noPubkeyAccountTip)}
          />
          <AccountTip
            key="__high_value_acc_tip__"
            open={
              this.account.balance.gt(HIGH_VALUE_ACCOUNT_THRESHOLD) &&
              this.account.type === AccountType.MNEMONIC &&
              typeof carlo === 'undefined'
            }
            message={intl.formatMessage(messages.highValueAccountTip)}
          />
          {recentTransactions.items.length === 0 &&
            recentTransactions.isLoading && <LoadingIndicator />}
          {toPairs(recentTransactions.groupedByDay).map(
            ([group, transactions]) => (
              <React.Fragment key={`${this.account.id}-${group}`}>
                <Typography className={classes.dateGroupTitle}>
                  {group}
                </Typography>
                <div>
                  {transactions.map(transaction => {
                    return (
                      <TxDetailsExpansionPanel
                        expanded={this.account.recentTransactions.expanded.includes(
                          transaction.id
                        )}
                        onExpand={this.handleExpand}
                        getSendLinkProps={this.getSendLinkProps}
                        key={transaction.id}
                        tx={transaction}
                        explorerUrl={this.account.config.explorer_url}
                        handleContactEdit={this.handleContactEdit}
                      />
                    );
                  })}
                </div>
              </React.Fragment>
            )
          )}
          {recentTransactions.hasMore && (
            <div className={classes.loadMore}>
              <Button
                disabled={
                  recentTransactions.isLoading ||
                  walletStore.connected !== LoadingState.LOADED
                }
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
