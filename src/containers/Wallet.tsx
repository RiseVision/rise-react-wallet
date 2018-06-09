import * as React from 'react';
import Hidden from '@material-ui/core/Hidden';
import Drawer from '@material-ui/core/Drawer';
import { Theme, createStyles, withStyles, WithStyles, withTheme, WithTheme } from '@material-ui/core/styles';
import DrawerContent from './DrawerContent';
import WalletAppBar from './WalletAppBar';
import AccountOverview from './AccountOverview';

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
    padding: theme.spacing.unit * 3,
  },
});

interface Props extends WithStyles<typeof styles> {
  page: string;
}

interface State {
  mobileDrawerOpen: boolean;
}

type DecoratedProps = Props & WithTheme;

const stylesDecorator = withStyles(styles, { 'name': 'Wallet' });
const themeDecorator = withTheme();

const Wallet = stylesDecorator<Props>(themeDecorator<DecoratedProps>(
  class extends React.Component<DecoratedProps, State> {
    constructor(props: DecoratedProps) {
      super(props);
      this.state = {
        mobileDrawerOpen: false,
      };
    }

    render() {
      const { classes, theme, page } = this.props;

      const drawer = (
        <DrawerContent />
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
              <AccountOverview />
            )}
          </main>
        </div>
      );
    }

    handleDrawerToggle = () => {
      this.setState({
        mobileDrawerOpen: !this.state.mobileDrawerOpen,
      });
    }
  }
));

export default Wallet;
