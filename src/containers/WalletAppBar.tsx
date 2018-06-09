import * as React from 'react';
import { InjectedIntlProps, injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { Theme, createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import MenuIcon from '@material-ui/icons/Menu';
import SettingsIcon from '@material-ui/icons/Settings';

const styles = (theme: Theme) => createStyles({
  drawerIcon: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  title: {
    flex: 1,
  },
});

interface Props extends WithStyles<typeof styles> {
  page: string;
  className?: string;
  onToggleDrawer: () => void;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'WalletAppBar' });

const messages = defineMessages({
  openDrawerAriaLabel: {
    id: 'wallet-appbar.open-drawer-aria-label',
    description: 'Accessibility label for open drawer icon',
    defaultMessage: 'Open drawer',
  },
  accountSettingsTooltip: {
    id: 'wallet-appbar.account-settings-tooltip',
    description: 'Tooltip for account settings icon',
    defaultMessage: 'Account settings',
  },
});

const WalletAppBar = stylesDecorator(injectIntl(
  class extends React.Component<DecoratedProps> {
    render() {
      const { intl, classes, page } = this.props;

      return (
        <AppBar className={this.props.className}>
          <Toolbar>
            <IconButton
              className={classes.drawerIcon}
              aria-label={intl.formatMessage(
                messages.openDrawerAriaLabel)}
              color="inherit"
              onClick={this.props.onToggleDrawer}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              className={classes.title}
              variant="title"
              color="inherit"
              noWrap={true}
            >
              {page === 'account-overview' && (
                <FormattedMessage
                  id="wallet-appbar.account-overview-title"
                  description="Account overview title"
                  defaultMessage="Account overview"
                />
              )}
            </Typography>
            {page === 'account-overview' && (
              <Tooltip title={intl.formatMessage(messages.accountSettingsTooltip)}>
                <IconButton
                  aria-label={intl.formatMessage(messages.accountSettingsTooltip)}
                  color="inherit"
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            )}
          </Toolbar>
        </AppBar>
      );
    }
  }
));

export default WalletAppBar;
