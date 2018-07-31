import { inject, observer } from 'mobx-react';
import * as React from 'react';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AccountOverviewHeader from '../../components/AccountOverviewHeader';
import TxDetailsExpansionPanel from '../../components/TxDetailsExpansionPanel';
import Store from '../../stores/store';
import WalletStore from '../../stores/wallet';
import { toPairs } from 'lodash';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2
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
  store?: Store;
  walletStore?: WalletStore;
}

const stylesDecorator = withStyles(styles, { name: 'AccountOverview' });

@inject('store')
@inject('walletStore')
@observer
class AccountOverview extends React.Component<Props> {
  render() {
    const { classes, walletStore } = this.props;
    const account = walletStore!.selectedAccount;

    return (
      <React.Fragment>
        {account ? (
          <AccountOverviewHeader
            address={account.id}
            alias={account.name}
            balance={account.balance + ' RISE'}
            balance_in_fiat={walletStore!.fiatAmount!}
          />
        ) : null}
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

export default stylesDecorator(AccountOverview);
