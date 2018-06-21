import * as React from 'react';
import { Theme, createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import AccountOverviewHeader from '../components/AccountOverviewHeader';

const styles = (theme: Theme) => createStyles({
  content: {
    padding: theme.spacing.unit * 3,
  },
});

interface Props extends WithStyles<typeof styles> {
}

const stylesDecorator = withStyles(styles, { name: 'AccountOverview' });

const AccountOverview = stylesDecorator(
  class extends React.Component<Props> {
    render() {
      let { classes } = this.props;

      return (
        <React.Fragment>
          <AccountOverviewHeader
            address="3884823134173068029R"
            alias="Demo account"
            balance="123,234.01 RISE"
            balance_in_fiat="~123.99 USD"
          />
          <div className={classes.content}>
            <Typography>
              Content TODO
            </Typography>
            <Paper>
              <Typography>
                Transaction
              </Typography>
            </Paper>
          </div>
        </React.Fragment>
      );
    }
  }
);

export default AccountOverview;
