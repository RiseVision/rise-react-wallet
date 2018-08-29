import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import MenuIcon from '@material-ui/icons/Menu';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import { accountOverviewRoute, accountSettingsRoute } from '../../routes';
import { accountStore } from '../../stores';
import AccountStore from '../../stores/account';

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
  className?: string;
  onToggleDrawer: () => void;
  account?: AccountStore;
}

interface PropsInjected extends Props {
  accountStore: AccountStore;
  routerStore: RouterStore;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'WalletAppBar' });

const messages = defineMessages({
  openDrawerAriaLabel: {
    id: 'wallet-appbar.open-drawer-aria-label',
    description: 'Accessibility label for open drawer icon',
    defaultMessage: 'Open drawer'
  },
  navigateBackAriaLabel: {
    id: 'wallet-appbar.navigate-back-aria-label',
    description: 'Accessibility label for back navigation icon',
    defaultMessage: 'Navigate back'
  },
  accountSettingsTooltip: {
    id: 'wallet-appbar.account-settings-tooltip',
    description: 'Tooltip for account settings icon',
    defaultMessage: 'Account settings'
  }
});

type AppBarState = null | 'accountOverview' | 'accountSettings';

@inject('routerStore')
@inject(accountStore)
@observer
class WalletAppBar extends React.Component<DecoratedProps> {
  appBarState() {
    const path = this.injected.routerStore.currentView.path;

    let state: AppBarState = null;
    if (path.startsWith('/account') || path.startsWith('/send')) {
      state = 'accountOverview';
    } else if (path.startsWith('/settings')) {
      state = 'accountSettings';
    }
    return state;
  }

  get injected(): PropsInjected & DecoratedProps {
    // @ts-ignore
    return this.props;
  }

  get account() {
    return this.injected.account || this.injected.accountStore;
  }

  handleNavigateBackClick = () => {
    const state = this.appBarState();
    if (state === 'accountSettings') {
      const id = this.account.id;
      this.injected.routerStore.goTo(accountOverviewRoute, { id });
    }
  }

  handleSettingsClick = () => {
    const id = this.account.id;
    this.injected.routerStore.goTo(accountSettingsRoute, { id });
  }

  render() {
    const { intl, classes } = this.injected;
    const state = this.appBarState();

    return (
      <AppBar className={this.injected.className} color="default">
        <Toolbar>
          {state === 'accountOverview' ? (
            <IconButton
              className={classes.drawerIcon}
              aria-label={intl.formatMessage(messages.openDrawerAriaLabel)}
              color="inherit"
              onClick={this.injected.onToggleDrawer}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <IconButton
              aria-label={intl.formatMessage(messages.navigateBackAriaLabel)}
              color="inherit"
              onClick={this.handleNavigateBackClick}
            >
              <ChevronLeftIcon />
            </IconButton>
          )}
          <Typography
            className={classes.title}
            variant="title"
            color="inherit"
            noWrap={true}
          >
            {state === 'accountOverview' && (
              <FormattedMessage
                id="wallet-appbar.account-overview-title"
                description="Account overview title"
                defaultMessage="Account overview"
              />
            )}
            {state === 'accountSettings' && (
              <FormattedMessage
                id="wallet-appbar.account-settings-title"
                description="Account settings title"
                defaultMessage="Account settings"
              />
            )}
          </Typography>
          {state === 'accountOverview' && (
            <Tooltip
              title={intl.formatMessage(messages.accountSettingsTooltip)}
            >
              <IconButton
                aria-label={intl.formatMessage(messages.accountSettingsTooltip)}
                color="inherit"
                onClick={this.handleSettingsClick}
              >
                <SettingsOutlinedIcon />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>
    );
  }
}

export default stylesDecorator(injectIntl(WalletAppBar));
