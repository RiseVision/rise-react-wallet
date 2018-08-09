import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { InjectedIntlProps, injectIntl, defineMessages } from 'react-intl';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import SendIcon from '@material-ui/icons/Send';
import AccountOverviewHeader from '../../components/AccountOverviewHeader';
import TxDetailsExpansionPanel from '../../components/TxDetailsExpansionPanel';
import RootStore from '../../stores/root';
import AppStore from '../../stores/app';
import WalletStore from '../../stores/wallet';
import { accountSendRoute } from '../../routes';
import { toPairs } from 'lodash';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2
    },
    fab: {
      position: 'fixed',
      right: 3 * theme.spacing.unit,
      bottom: 3 * theme.spacing.unit
    },
    dateGroupTitle: {
      marginTop: theme.spacing.unit * 2,
      marginBottom: theme.spacing.unit,
      ['&:first-child']: {
        marginTop: 0
      }
    }
  });

interface Props extends WithStyles<typeof styles> {
  store?: RootStore;
  appStore?: AppStore;
  walletStore?: WalletStore;
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

@inject('store')
@inject('appStore')
@inject('walletStore')
@observer
class AccountOverview extends React.Component<DecoratedProps> {
  handleSendClick = () => {
    const { store } = this.props;
    store!.router.goTo(accountSendRoute);
  }

  render() {
    const { intl, classes, walletStore } = this.props;
    const account = walletStore!.selectedAccount;
    const unnamedAccountLabel = intl.formatMessage(
      messages.unnamedAccountLabel
    );

    const readOnly = account && account.readOnly;

    return (
      <React.Fragment>
        {account ? (
          <AccountOverviewHeader
            address={account.id}
            alias={account.name || unnamedAccountLabel}
            balance={account.balance + ' RISE'}
            balance_in_fiat={walletStore!.fiatAmount!}
          />
        ) : null}
        {!readOnly && (
          <Tooltip
            placement="left"
            title={intl.formatMessage(messages.sendFabTooltip)}
          >
            <Button
              variant="fab"
              className={classes.fab}
              onClick={this.handleSendClick}
            >
              <SendIcon />
            </Button>
          </Tooltip>
        )}
        <div className={classes.content}>
          {toPairs(walletStore!.groupedTransactions).map(
            ([group, transactions]) => (
              <React.Fragment key={group}>
                <Typography
                  className={classes.dateGroupTitle}
                  variant="body2"
                  color="textSecondary"
                >
                  {group}
                </Typography>
                <div>
                  {transactions.map(transaction => (
                    <TxDetailsExpansionPanel
                      key={transaction.id}
                      tx={transaction.info}
                    />
                  ))}
                </div>
              </React.Fragment>
            )
          )}
        </div>
      </React.Fragment>
    );
  }
}

export default stylesDecorator(injectIntl(AccountOverview));
