import { inject, observer } from 'mobx-react';
import * as React from 'react';
import {
  InjectedIntlProps,
  injectIntl,
  defineMessages,
  FormattedMessage
} from 'react-intl';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import MenuIcon from '@material-ui/icons/Menu';
import SettingsIcon from '@material-ui/icons/Settings';
import Store from '../../stores/store';

const styles = (theme: Theme) =>
  createStyles({
    drawerIcon: {
      [theme.breakpoints.up('md')]: {
        display: 'none'
      }
    },
    title: {
      flex: 1
    }
  });

interface Props extends WithStyles<typeof styles> {
  store?: Store;
  className?: string;
  onToggleDrawer: () => void;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'WalletAppBar' });

const messages = defineMessages({
  openDrawerAriaLabel: {
    id: 'wallet-appbar.open-drawer-aria-label',
    description: 'Accessibility label for open drawer icon',
    defaultMessage: 'Open drawer'
  },
  accountSettingsTooltip: {
    id: 'wallet-appbar.account-settings-tooltip',
    description: 'Tooltip for account settings icon',
    defaultMessage: 'Account settings'
  }
});

@inject('store')
@observer
class WalletAppBar extends React.Component<DecoratedProps> {
  render() {
    const { intl, classes } = this.props;
    const currentView = this.props.store!.router.currentView;

    return (
      <AppBar className={this.props.className}>
        <Toolbar>
          <IconButton
            className={classes.drawerIcon}
            aria-label={intl.formatMessage(messages.openDrawerAriaLabel)}
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
            {currentView.path === '/wallet' && (
              <FormattedMessage
                id="wallet-appbar.account-overview-title"
                description="Account overview title"
                defaultMessage="Account overview"
              />
            )}
            {currentView.path === '/wallet/settings' && (
              <FormattedMessage
                id="wallet-appbar.account-settings-title"
                description="Account settings title"
                defaultMessage="Account settings"
              />
            )}
          </Typography>
          {currentView.path === '/wallet' && (
            <Tooltip
              title={intl.formatMessage(messages.accountSettingsTooltip)}
            >
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

// TODO convert to TS decorators
export default stylesDecorator(injectIntl(WalletAppBar));
