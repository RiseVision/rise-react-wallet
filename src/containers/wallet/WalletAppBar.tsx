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
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import Link from '../../components/Link';
import {
  accountOverviewRoute,
  accountSettingsRoute,
  accountsListRoute
} from '../../routes';
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

type AppBarState =
  | null
  | 'accountOverview'
  | 'accountSettings'
  | 'addressBook'
  | 'accountsList';

@inject('routerStore')
@inject(accountStore)
@observer
class WalletAppBar extends React.Component<DecoratedProps> {
  appBarState() {
    const { routerStore } = this.injected;
    const path = routerStore.currentView.path;

    let state: AppBarState = null;
    if (routerStore.currentView === accountsListRoute) {
      state = 'accountsList';
    } else if (path.startsWith('/account') || path.startsWith('/send')) {
      state = 'accountOverview';
    } else if (path.startsWith('/settings')) {
      state = 'accountSettings';
    } else if (path.startsWith('/address-book')) {
      state = 'addressBook';
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

  backLink() {
    const state = this.appBarState();
    if (state === 'accountSettings') {
      return {
        route: accountOverviewRoute,
        params: {
          id: this.account.id
        }
      };
    } else {
      throw new Error('Invalid state for backLink');
    }
  }

  render() {
    const { intl, classes } = this.injected;
    const state = this.appBarState();

    const isTopRoute =
      state === 'accountOverview' ||
      state === 'accountsList' ||
      state === 'addressBook';

    return (
      <AppBar className={this.injected.className} color="default">
        <Toolbar>
          {isTopRoute ? (
            <IconButton
              className={classes.drawerIcon}
              aria-label={intl.formatMessage(messages.openDrawerAriaLabel)}
              color="inherit"
              onClick={this.injected.onToggleDrawer}
            >
              <MenuIcon />
            </IconButton>
          ) : (
            <Link {...this.backLink()}>
              <IconButton
                aria-label={intl.formatMessage(messages.navigateBackAriaLabel)}
                color="inherit"
              >
                <ChevronLeftIcon />
              </IconButton>
            </Link>
          )}
          <Typography
            className={classes.title}
            variant="h6"
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
            {state === 'addressBook' && (
              <FormattedMessage
                id="wallet-appbar.address-book-title"
                description="Address book title"
                defaultMessage="Address book"
              />
            )}
            {state === 'accountsList' && (
              <FormattedMessage
                id="wallet-appbar.accounts-list-title"
                description="Accounts list title"
                defaultMessage="All accounts"
              />
            )}
          </Typography>
          {state === 'accountOverview' && (
            <Tooltip
              title={intl.formatMessage(messages.accountSettingsTooltip)}
            >
              <Link
                route={accountSettingsRoute}
                params={{
                  id: this.account.id
                }}
              >
                <IconButton
                  aria-label={intl.formatMessage(
                    messages.accountSettingsTooltip
                  )}
                  color="inherit"
                >
                  <SettingsOutlinedIcon />
                </IconButton>
              </Link>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>
    );
  }
}

export default stylesDecorator(injectIntl(WalletAppBar));
