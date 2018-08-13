import { inject, observer } from 'mobx-react';
import * as React from 'react';
import Hidden from '@material-ui/core/Hidden';
import Drawer from '@material-ui/core/Drawer';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles,
  withTheme,
  WithTheme
} from '@material-ui/core/styles';
import AppStore from '../../stores/app';
import DrawerContent from './DrawerContent';
import WalletAppBar from './WalletAppBar';

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
        overflow: 'auto',
      },
    }
  });

interface Props extends WithStyles<typeof styles> {
  appStore?: AppStore;
}

interface State {
  mobileDrawerOpen: boolean;
}

type DecoratedProps = Props & WithTheme;

const stylesDecorator = withStyles(styles, { name: 'Wallet' });
const themeDecorator = withTheme();

@inject('appStore')
@observer
class Wallet extends React.Component<DecoratedProps, State> {
  constructor(props: DecoratedProps) {
    super(props);
    this.state = {
      mobileDrawerOpen: false
    };
  }

  render(): React.ReactElement<HTMLDivElement> {
    const { classes, theme } = this.props;

    const drawer = <DrawerContent />;

    return (
      <div className={classes.root}>
        <WalletAppBar
          className={classes.appBar}
          onToggleDrawer={this.handleDrawerToggle}
        />
        <Hidden mdUp={true}>
          <Drawer
            variant="temporary"
            anchor={theme.direction === 'rtl' ? 'right' : 'left'}
            open={this.state.mobileDrawerOpen}
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
        <Hidden smDown={true} implementation="css">
          <Drawer
            variant="permanent"
            open={true}
            classes={{
              paper: classes.drawerPaper
            }}
            children={drawer}
          />
        </Hidden>
        <main className={classes.content}>
          <div className={classes.toolbar} />
          {this.props.children}
        </main>
      </div>
    );
  }

  handleDrawerToggle = () => {
    this.setState({
      mobileDrawerOpen: !this.state.mobileDrawerOpen
    });
  }
}

export default stylesDecorator<Props>(themeDecorator<DecoratedProps>(Wallet));
