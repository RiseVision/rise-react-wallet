import { Tooltip } from '@material-ui/core';
import Divider from '@material-ui/core/es/Divider';
import Paper from '@material-ui/core/es/Paper';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/es/styles';
import Typography from '@material-ui/core/es/Typography';
import classNames from 'classnames';
import React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import AccountIcon from '../components/AccountIcon';
import { RawAmount } from '../utils/amounts';
import { formatAmount, formatFiat } from '../utils/utils';

const styles = (theme: Theme) => {
  const step = 5;
  const unit = 'px';
  const { sm } = theme.breakpoints.values;
  const xxs = theme.breakpoints.values.sm / 2;

  // Create custom breakpoints
  const singleLineLayout = theme.breakpoints.up('sm');
  const multiLineLayout = theme.breakpoints.down('xs');
  const iconInLayout = singleLineLayout;
  const iconAbsolute = `@media (min-width: ${xxs}${unit}) and (max-width: ${sm -
    step / 100}${unit})`;
  const iconHidden = `@media (max-width: ${xxs - step / 100}${unit})`;

  return createStyles({
    container: {
      position: 'relative',
      [singleLineLayout]: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing.unit
      }
    },
    icon: {
      padding: theme.spacing.unit,
      [iconInLayout]: {},
      [iconAbsolute]: {
        position: 'absolute',
        top: `calc(50% - ${(64 + 2 * theme.spacing.unit) / 2}px)`,
        right: 2 * theme.spacing.unit,
        backgroundColor: 'white',
        border: `1px solid ${theme.palette.divider}`
      },
      [iconHidden]: {
        display: 'none'
      }
    },
    divider: {
      [singleLineLayout]: {
        display: 'none'
      }
    },
    section: {
      [iconAbsolute]: {
        marginRight: 64 + 4 * theme.spacing.unit + 2
      },
      [multiLineLayout]: {
        padding: 2 * theme.spacing.unit
      },
      [singleLineLayout]: {
        flex: 1,
        padding: theme.spacing.unit
      }
    },
    account_section: {},
    balance_section: {
      [singleLineLayout]: {
        textAlign: 'right'
      }
    },
    primary_text: {
      ...theme.typography.subtitle1,
      color: theme.palette.text.primary
    },
    secondary_text: {
      color: theme.palette.text.secondary
    }
  });
};

interface Props extends WithStyles<typeof styles> {
  address: string;
  alias: string | null;
  balance: RawAmount;
  balanceFiat: number | null;
  fiatCurrency: string;
  className?: string;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'AccountOverviewHeader' });

const messages = defineMessages({
  aliasAriaLabel: {
    id: 'account-overview-header.alias-aria-label',
    description: 'Accessibility label for account name/alias',
    defaultMessage: 'Account'
  },
  addressAriaLabel: {
    id: 'account-overview-header.address-aria-label',
    description: 'Accessibility label for account address',
    defaultMessage: 'Account address'
  },
  balanceAriaLabel: {
    id: 'account-overview-header.balance-aria-label',
    description: 'Accessibility label for account balance',
    defaultMessage: 'Balance'
  }
});

const AccountOverviewHeader = stylesDecorator(
  injectIntl(
    class extends React.Component<DecoratedProps> {
      render() {
        const {
          intl,
          classes,
          className,
          address,
          alias,
          balance,
          balanceFiat,
          fiatCurrency
        } = this.props;

        return (
          <Paper
            square={true}
            className={classNames(classes.container, className)}
          >
            <div className={classes.icon} aria-hidden={true}>
              <AccountIcon size={64} address={address} />
            </div>
            <div
              className={classNames(classes.section, classes.account_section)}
            >
              <Typography
                className={classes.primary_text}
                aria-label={intl.formatMessage(messages.aliasAriaLabel)}
              >
                {alias}
              </Typography>
              <Typography
                className={classes.secondary_text}
                aria-label={intl.formatMessage(messages.addressAriaLabel)}
              >
                {address}
              </Typography>
            </div>
            <Divider className={classes.divider} />
            <div
              className={classNames(classes.section, classes.balance_section)}
            >
              <Typography
                className={classes.primary_text}
                aria-label={intl.formatMessage(messages.balanceAriaLabel)}
              >
                {formatAmount(intl, balance)}
              </Typography>
              {!!balanceFiat && (
                <Typography className={classes.secondary_text}>
                  <Tooltip title="Powered by CoinGecko">
                    <span>{formatFiat(intl, balanceFiat, fiatCurrency)}</span>
                  </Tooltip>
                </Typography>
              )}
            </div>
          </Paper>
        );
      }
    }
  )
);

export default AccountOverviewHeader;
