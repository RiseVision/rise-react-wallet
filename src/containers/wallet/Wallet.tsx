import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
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
        display: 'none',
      },
    },
    drawerPaper: {
      width: drawerWidth,
      [theme.breakpoints.up('md')]: {
        position: 'relative'
      }
    },
    toolbar: theme.mixins.toolbar,
    content: {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      maxHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: theme.palette.background.default,
      '& > :last-child': {
        flex: 1,
        overflow: 'auto'
      }
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
    if (this.disposeRouteMonitor) {
      this.disposeRouteMonitor();
      this.disposeRouteMonitor = null;
    }
  }

  render(): React.ReactElement<HTMLDivElement> {
    const { classes, theme } = this.injected;
    const { mobileDrawerOpen, signOutOpen } = this.state;

    const drawer = (
      <DrawerContent
        onSignOutClick={this.handleOpenSignOutPrompt}
        onAfterNavigate={this.handleAfterNavigate}
      />
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
        </main>
        <Dialog
          open={signOutOpen}
          onClose={this.handleCancelSignOutPrompt}
        >
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
      signOutOpen: false,
    });

    walletStore.signout();
    routerStore.goTo(onboardingAddAccountRoute);
  }

  handleCancelSignOutPrompt = () => {
    this.setState({
      signOutOpen: false,
    });
  }

  handleOpenSignOutPrompt = () => {
    this.setState({
      mobileDrawerOpen: false,
      signOutOpen: true,
    });
  }

  handleAfterNavigate = () => {
    this.setState({
      mobileDrawerOpen: false,
    });
  }
}

export default stylesDecorator(themeDecorator(Wallet));
