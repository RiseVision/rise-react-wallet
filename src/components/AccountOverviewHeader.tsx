import * as React from 'react';
import * as classNames from 'classnames';
import { Theme, createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import AccountIcon from '../components/AccountIcon';

const styles = (theme: Theme) => {
  const step = 5;
  const unit = 'px';
  const { sm } = theme.breakpoints.values;
  const xxs = theme.breakpoints.values.sm / 2;

  // Create custom breakpoints
  const singleLineLayout = theme.breakpoints.up('sm');
  const multiLineLayout = theme.breakpoints.down('xs');
  const iconInLayout = singleLineLayout;
  const iconAbsolute = `@media (min-width: ${xxs}${unit}) and (max-width: ${sm - step / 100}${unit})`;
  const iconHidden = `@media (max-width: ${xxs - step / 100}${unit})`;

  return createStyles({
    container: {
      position: 'relative',
      [singleLineLayout]: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing.unit,
      },
    },
    icon: {
      padding: theme.spacing.unit,
      [iconInLayout]: {
      },
      [iconAbsolute]: {
        position: 'absolute',
        top: `calc(50% - ${(64 + 2 * theme.spacing.unit) / 2}px)`,
        right: 2 * theme.spacing.unit,
        backgroundColor: 'white',
        border: `1px solid ${theme.palette.divider}`,
      },
      [iconHidden]: {
        display: 'none',
      },
    },
    divider: {
      [singleLineLayout]: {
        display: 'none',
      },
    },
    section: {
      [iconAbsolute]: {
        marginRight: 64 + 4 * theme.spacing.unit + 2,
      },
      [multiLineLayout]: {
        padding: 2 * theme.spacing.unit,
      },
      [singleLineLayout]: {
        flex: 1,
        padding: theme.spacing.unit,
      },
    },
    account_section: {
    },
    balance_section: {
      [singleLineLayout]: {
        textAlign: 'right',
      },
    },
    primary_text: {
      ...theme.typography.subheading,
      color: theme.palette.text.primary,
    },
    secondary_text: {
      color: theme.palette.text.secondary,
    },
  });
};

interface Props extends WithStyles<typeof styles> {
  address: string;
  alias: string;
  balance: string;
  balance_in_fiat: string;
}

const stylesDecorator = withStyles(styles, { name: 'AccountOverviewHeader' });

const AccountOverviewHeader = stylesDecorator(
  class extends React.Component<Props> {
    render() {
      const {
        classes,
        address,
        alias,
        balance,
        balance_in_fiat,
      } = this.props;

      return (
        <Paper square={true} className={classes.container}>
          <div className={classes.icon}>
            <AccountIcon
              size={64}
              address={address}
            />
          </div>
          <div
            className={classNames(
              classes.section,
              classes.account_section,
            )}
          >
            <Typography className={classes.primary_text}>
              {alias}
            </Typography>
            <Typography className={classes.secondary_text}>
              {address}
            </Typography>
          </div>
          <Divider className={classes.divider} />
          <div
            className={classNames(
              classes.section,
              classes.balance_section,
            )}
          >
            <Typography className={classes.primary_text}>
              {balance}
            </Typography>
            <Typography className={classes.secondary_text}>
              {balance_in_fiat}
            </Typography>
          </div>
        </Paper>
      );
    }
  }
);

export default AccountOverviewHeader;
