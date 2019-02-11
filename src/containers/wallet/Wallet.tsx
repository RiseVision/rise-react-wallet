import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import Typography from '@material-ui/core/Typography';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles,
  withTheme,
  WithTheme
} from '@material-ui/core/styles';
import { reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import DrawerContent from './DrawerContent';
import WalletAppBar from './WalletAppBar';
import Dialog from '../../components/Dialog';
import SignOutDialogContent from '../../components/content/SignOutDialogContent';
import { onboardingAddAccountRoute } from '../../routes';
import WalletStore from '../../stores/wallet';
import { version } from '../../../package.json';
// @ts-ignore
import * as inobounce from 'inobounce';

const drawerWidth = 280;

const styles = (theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      zIndex: 1,
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      minHeight: '100vh',
      width: '100%'
    },
    appBar: {
      position: 'absolute',
      marginLeft: drawerWidth,
      [theme.breakpoints.up('md')]: {
        width: `calc(100% - ${drawerWidth}px)`
      }
    },
    permanentDrawerContainer: {
      display: 'flex',
      [theme.breakpoints.down('sm')]: {
        display: 'none'
      }
    },
    drawerPaper: {
      width: drawerWidth,
      [theme.breakpoints.up('md')]: {
        position: 'relative'
      }
    },
    toolbar: theme.mixins.toolbar,
    iosBottomBar: {
      minHeight: 0,
      [`@supports (-webkit-overflow-scrolling: touch)`]: {
        // rough estimation for the safari's bottom status bar's height
        minHeight: (window.screen.availHeight - window.innerHeight) * 0.62
      }
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      maxHeight: '100vh',
      overflow: 'auto',
      backgroundColor: theme.palette.background.default,
      '& > :last-child': {
        flex: 1,
        overflow: 'auto'
      }
    },
    drawerSpacer: {
      flex: 1
    },
    versionFooter: {
      textAlign: 'center',
      color: theme.palette.grey['500'],
      fontSize: theme.typography.pxToRem(12)
    }
  });

interface Props extends WithStyles<typeof styles> {}

interface State {
  mobileDrawerOpen: boolean;
  signOutOpen: boolean;
}

type DecoratedProps = Props & WithTheme;

interface PropsInjected extends DecoratedProps {
  routerStore: RouterStore;
  walletStore: WalletStore;
}

const stylesDecorator = withStyles(styles, { name: 'Wallet' });
const themeDecorator = withTheme();

@inject('walletStore')
@inject('routerStore')
@observer
class Wallet extends React.Component<DecoratedProps, State> {
  disposeRouteMonitor: null | IReactionDisposer = null;

  constructor(props: DecoratedProps) {
    super(props);
    this.state = {
      mobileDrawerOpen: false,
      signOutOpen: false
    };
  }

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  componentWillMount() {
    // store info if the current platform is supported
    if (typeof inobounce.supported === 'undefined') {
      inobounce.supported = inobounce.isEnabled();
    }
    if (inobounce.supported) {
      inobounce.enable();
    }
    // Automatically close signOut prompt on route change
    this.disposeRouteMonitor = reaction(
      () => {
        const { routerStore } = this.injected;
        return routerStore.currentView;
      },
      () => {
        this.setState({ signOutOpen: false });
      }
    );
  }

  componentWillUnmount() {
    inobounce.disable();
    if (this.disposeRouteMonitor) {
      this.disposeRouteMonitor();
      this.disposeRouteMonitor = null;
    }
  }

  render(): React.ReactElement<HTMLDivElement> {
    const { classes, theme } = this.injected;
    const { mobileDrawerOpen, signOutOpen } = this.state;

    const drawer = (
      <React.Fragment>
        <DrawerContent
          onSignOutClick={this.handleOpenSignOutPrompt}
          onAfterNavigate={this.handleAfterNavigate}
        />
        <div className={classes.drawerSpacer} />
        <Typography
          className={classes.versionFooter}
          component="footer"
          aria-hidden={true}
          children={`v${version}`}
        />
      </React.Fragment>
    );

    return (
      <div className={classes.root}>
        <Hidden mdUp={true}>
          <Drawer
            variant="temporary"
            anchor={theme.direction === 'rtl' ? 'right' : 'left'}
            open={mobileDrawerOpen}
            onClose={this.handleDrawerToggle}
            classes={{
              paper: classes.drawerPaper
            }}
            ModalProps={{
              keepMounted: true // Better open performance on mobile.
            }}
            children={drawer}
          />
        </Hidden>
        <div className={classes.permanentDrawerContainer}>
          <Drawer
            variant="permanent"
            open={true}
            classes={{
              paper: classes.drawerPaper
            }}
            children={drawer}
          />
        </div>
        <WalletAppBar
          className={classes.appBar}
          onToggleDrawer={this.handleDrawerToggle}
        />
        <main className={classes.content}>
          <div className={classes.toolbar} />
          {this.props.children}
          <div className={classes.iosBottomBar} />
        </main>
        <Dialog open={signOutOpen} onClose={this.handleCancelSignOutPrompt}>
          <SignOutDialogContent
            onConfirm={this.handleConfirmSignOut}
            onCancel={this.handleCancelSignOutPrompt}
          />
        </Dialog>
      </div>
    );
  }

  handleDrawerToggle = () => {
    this.setState({
      mobileDrawerOpen: !this.state.mobileDrawerOpen
    });
  }

  handleConfirmSignOut = () => {
    const { walletStore, routerStore } = this.injected;

    this.setState({
      signOutOpen: false
    });

    walletStore.signout();
    routerStore.goTo(onboardingAddAccountRoute);
  }

  handleCancelSignOutPrompt = () => {
    this.setState({
      signOutOpen: false
    });
  }

  handleOpenSignOutPrompt = () => {
    this.setState({
      mobileDrawerOpen: false,
      signOutOpen: true
    });
  }

  handleAfterNavigate = () => {
    this.setState({
      mobileDrawerOpen: false
    });
  }
}

export default stylesDecorator(themeDecorator(Wallet));
