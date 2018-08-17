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
import * as React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import AccountOverviewHeader from '../../components/AccountOverviewHeader';
import TxDetailsExpansionPanel from '../../components/TxDetailsExpansionPanel';
import { accountSendRoute } from '../../routes';
import AccountContainer from './AccountContainer';
import { State } from './VoteDelegate';

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
  routerStore?: RouterStore;
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

@inject('routerStore')
@observer
class AccountOverview extends AccountContainer<DecoratedProps, State> {
  handleSendClick = () => {
    this.props.routerStore!.goTo(accountSendRoute);
  }

  render() {
    const { intl, classes } = this.props;
    const unnamedAccountLabel = intl.formatMessage(
      messages.unnamedAccountLabel
    );

    const readOnly = this.account && this.account.readOnly;

    return (
      <React.Fragment>
        <AccountOverviewHeader
          address={this.account.id}
          alias={this.account.name || unnamedAccountLabel}
          balance={this.account.balance + ' RISE'}
          balance_in_fiat={this.account.balanceFiat || ''}
        />
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
          {toPairs(this.account.recentTransactions.groupedByDay).map(
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
