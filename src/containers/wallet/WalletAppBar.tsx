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
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import SettingsOutlinedIcon from '@material-ui/icons/SettingsOutlined';
import {
  accountOverviewRoute,
  accountSettingsRoute,
} from '../../routes';
import RootStore from '../../stores/root';

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
  store?: RootStore;
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
  | 'accountSettings';

@inject('store')
@observer
class WalletAppBar extends React.Component<DecoratedProps> {
  appBarState() {
    const { store } = this.props;
    const path = store!.router.currentView.path;

    let state: AppBarState = null;
    if (path === '/wallet' || path.startsWith('/wallet/send')) {
      state = 'accountOverview';
    } else if (path === '/wallet/settings') {
      state = 'accountSettings';
    }
    return state;
  }

  handleNavigateBackClick = () => {
    const { store } = this.props;
    const state = this.appBarState();

    if (state === 'accountSettings') {
      store!.router.goTo(accountOverviewRoute);
    }
  }

  render() {
    const { intl, classes, store } = this.props;
    const state = this.appBarState();

    return (
      <AppBar className={this.props.className}>
        <Toolbar>
          {state === 'accountOverview' ? (
            <IconButton
              className={classes.drawerIcon}
              aria-label={intl.formatMessage(messages.openDrawerAriaLabel)}
              color="inherit"
              onClick={this.props.onToggleDrawer}
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
                onClick={() => store!.router.goTo(accountSettingsRoute)}
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

// TODO convert to TS decorators
export default stylesDecorator(injectIntl(WalletAppBar));
