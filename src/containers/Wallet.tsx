import * as React from 'react';
import { InjectedIntlProps, injectIntl, defineMessages } from 'react-intl';
import Hidden from '@material-ui/core/Hidden';
import Drawer from '@material-ui/core/Drawer';
import { Theme, createStyles, withStyles, WithStyles, withTheme, WithTheme } from '@material-ui/core/styles';
import DrawerContent from './DrawerContent';
import WalletAppBar from './WalletAppBar';
import AccountOverview from './AccountOverview';
import WalletTestOverModal from './WalletTestOverModal';

const drawerWidth = 280;

const styles = (theme: Theme) => createStyles({
  root: {
    flexGrow: 1,
    zIndex: 1,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    width: '100%',
  },
  appBar: {
    position: 'absolute',
    marginLeft: drawerWidth,
    [theme.breakpoints.up('md')]: {
      width: `calc(100% - ${drawerWidth}px)`,
    },
  },
  drawerPaper: {
    width: drawerWidth,
    [theme.breakpoints.up('md')]: {
      position: 'relative',
    },
  },
  toolbar: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
  },
});

interface Props extends WithStyles<typeof styles> {
  page: string;
  address: string | null;
  onPageChanged: (page: string, props?: {
    address?: string | null;
  }) => void;
}

interface State {
  mobileDrawerOpen: boolean;
  testEndTimer: number | null;
  testEndOpen: boolean;
}

type DecoratedProps = Props & WithTheme & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { 'name': 'Wallet' });
const themeDecorator = withTheme();

const messages = defineMessages({
  demoAccountAlias: {
    id: 'wallet.demo-account-alias',
    description: 'Alias for demo account',
    defaultMessage: 'Demo account',
  },
  unnamedAccountAlias: {
    id: 'wallet.unnamed-account-alias',
    description: 'Alias for unnamed account',
    defaultMessage: 'Unnamed account',
  },
});

const Wallet = stylesDecorator<Props>(injectIntl(themeDecorator<DecoratedProps>(
  class extends React.Component<DecoratedProps, State> {
    constructor(props: DecoratedProps) {
      super(props);
      this.state = {
        mobileDrawerOpen: false,
        testEndTimer: null,
        testEndOpen: false,
      };
    }

    componentDidMount() {
      let { testEndTimer, testEndOpen } = this.state;
      if (!testEndOpen && testEndTimer === null) {
        testEndTimer = window.setTimeout(
          () => this.setState({
            testEndTimer: null,
            testEndOpen: true,
          }),
          1500);
        this.setState({ testEndTimer });
      }
    }

    componentWillUnmount() {
      const { testEndTimer } = this.state;
      if (testEndTimer !== null) {
        clearTimeout(testEndTimer);
      }
    }

    render() {
      const { intl, classes, theme, page } = this.props;
      let address = this.props.address || '3884823134173068029R';
      let alias = intl.formatMessage(address === '3884823134173068029R'
        ? messages.demoAccountAlias
        : messages.unnamedAccountAlias);

      const drawer = (
        <DrawerContent
          address={address}
          alias={alias}
        />
      );

      return (
        <div className={classes.root}>
          <WalletAppBar
            className={classes.appBar}
            page={page}
            onToggleDrawer={this.handleDrawerToggle}
          />
          <Hidden mdUp={true}>
            <Drawer
              variant="temporary"
              anchor={theme.direction === 'rtl' ? 'right' : 'left'}
              open={this.state.mobileDrawerOpen}
              onClose={this.handleDrawerToggle}
              classes={{
                paper: classes.drawerPaper,
              }}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile.
              }}
              children={drawer}
            />
          </Hidden>
          <Hidden smDown={true} implementation="css">
            <Drawer
              variant="permanent"
              open={true}
              classes={{
                paper: classes.drawerPaper,
              }}
              children={drawer}
            />
          </Hidden>
          <main className={classes.content}>
            <div className={classes.toolbar} />
            {page === 'account-overview' && (
              <AccountOverview
                address={address}
                alias={alias}
              />
            )}
          </main>
          <WalletTestOverModal
            open={this.state.testEndOpen}
            onGoHome={this.handleOpenOnboardingAddAccountPage}
          />
        </div>
      );
    }

    handleDrawerToggle = () => {
      this.setState({
        mobileDrawerOpen: !this.state.mobileDrawerOpen,
      });
    }

    handleOpenOnboardingAddAccountPage = () => {
      this.props.onPageChanged('onboarding-add-account');
    }
  }
)));

export default Wallet;
