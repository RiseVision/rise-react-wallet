import { inject, observer } from 'mobx-react';
import * as React from 'react';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AccountOverviewHeader from '../components/AccountOverviewHeader';
import TxDetailsExpansionPanel from '../components/TxDetailsExpansionPanel';
import Store from '../store';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      padding: theme.spacing.unit * 2
    },
    date_group_title: {
      marginTop: theme.spacing.unit * 2,
      marginBottom: theme.spacing.unit,
      ['&:first-child']: {
        marginTop: 0
      }
    }
  });

interface Props extends WithStyles<typeof styles> {
  store?: Store;
}

const stylesDecorator = withStyles(styles, { name: 'AccountOverview' });

@inject('store')
@observer
class AccountOverview extends React.Component<Props> {
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
          <Typography
            className={classes.date_group_title}
            variant="body2"
            color="textSecondary"
          >
            Yesterday
          </Typography>
          <div>
            <TxDetailsExpansionPanel
              tx={{
                kind: 'receive',
                sender_alias: 'John Wick',
                sender_address: '5965187292146641611R',
                amount: 20.33
              }}
            />
            <TxDetailsExpansionPanel
              tx={{
                kind: 'send',
                recipient_alias: 'John Wick',
                recipient_address: '5965187292146641611R',
                amount: 1220.33
              }}
            />
          </div>
          <Typography
            className={classes.date_group_title}
            variant="body2"
            color="textSecondary"
          >
            21st of June
          </Typography>
          <div>
            <TxDetailsExpansionPanel
              tx={{
                kind: 'receive',
                sender_alias: 'John Wick',
                sender_address: '5965187292146641611R',
                amount: 20.33
              }}
            />
            <TxDetailsExpansionPanel
              tx={{
                kind: 'send',
                recipient_alias: 'John Wick',
                recipient_address: '5965187292146641611R',
                amount: 1220.33
              }}
            />
          </div>
          <Typography
            className={classes.date_group_title}
            variant="body2"
            color="textSecondary"
          >
            3rd of June
          </Typography>
          <div>
            <TxDetailsExpansionPanel
              tx={{
                kind: 'receive',
                sender_alias: 'John Wick',
                sender_address: '5965187292146641611R',
                amount: 20.33
              }}
            />
            <TxDetailsExpansionPanel
              tx={{
                kind: 'send',
                recipient_alias: 'John Wick',
                recipient_address: '5965187292146641611R',
                amount: 1220.33
              }}
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default stylesDecorator(AccountOverview);
