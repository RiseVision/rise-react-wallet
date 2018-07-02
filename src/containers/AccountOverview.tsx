import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Theme, createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AccountOverviewHeader from '../components/AccountOverviewHeader';

const styles = (theme: Theme) => createStyles({
  content: {
    padding: theme.spacing.unit * 2,
  },
  noTransactions: {
    marginTop: theme.spacing.unit * 8,
    textAlign: 'center',
    fontWeight: 'normal',
  },
});

interface Props extends WithStyles<typeof styles> {
  address: string;
  alias: string;
}

const stylesDecorator = withStyles(styles, { name: 'AccountOverview' });

const AccountOverview = stylesDecorator(
  class extends React.Component<Props> {
    render() {
      let { classes, address, alias } = this.props;

      return (
        <React.Fragment>
          <AccountOverviewHeader
            address={address}
            alias={alias}
            balance="0 RISE"
            balance_in_fiat="0 USD"
          />
          <div className={classes.content}>
            <Typography
              className={classes.noTransactions}
              variant="body2"
              color="textSecondary"
            >
              <FormattedMessage
                id="account-overview.no-transactions"
                description="No transactions label"
                defaultMessage="This account has no transaction history yet"
              />
            </Typography>
          </div>
        </React.Fragment>
      );
    }
  }
);

export default AccountOverview;
