import * as React from 'react';
import { InjectedIntlProps, injectIntl, defineMessages } from 'react-intl';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import Drawer from '@material-ui/core/Drawer';
import MenuIcon from '@material-ui/icons/Menu';
import { Theme, createStyles, withStyles, WithStyles, withTheme, WithTheme } from '@material-ui/core/styles';
import DrawerContent from './DrawerContent';

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
  drawerIcon: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
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
}

interface State {
  mobileDrawerOpen: boolean;
}

type DecoratedProps = Props & InjectedIntlProps & WithTheme;

const stylesDecorator = withStyles(styles, { 'name': 'Wallet' });

const messages = defineMessages({
  openDrawerAriaLabel: {
    id: 'wallet.open-drawer-aria-label',
    description: 'Accessibility label for open drawer icon',
    defaultMessage: 'Open drawer',
  },
});

const Wallet = withTheme()(stylesDecorator(injectIntl(
  class extends React.Component<DecoratedProps, State> {
    constructor(props: DecoratedProps) {
      super(props);
      this.state = {
        mobileDrawerOpen: false,
      };
    }

    render() {
      const { intl, classes, theme } = this.props;

      const drawer = (
        <DrawerContent />
      );

      return (
        <div className={classes.root}>
          <AppBar className={classes.appBar}>
            <Toolbar>
              <IconButton
                className={classes.drawerIcon}
                aria-label={intl.formatMessage(
                  messages.openDrawerAriaLabel)}
                color="inherit"
                onClick={this.handleDrawerToggle}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="title" color="inherit" noWrap={true}>
                Title TODO
              </Typography>
            </Toolbar>
          </AppBar>
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
            <Typography>
              Content TODO
            </Typography>
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
)));

export default Wallet;
