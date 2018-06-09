import * as React from 'react';
import { InjectedIntlProps, injectIntl, defineMessages } from 'react-intl';
import { Theme, createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import MenuIcon from '@material-ui/icons/Menu';

const styles = (theme: Theme) => createStyles({
  drawerIcon: {
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
});

interface Props extends WithStyles<typeof styles> {
  onToggleDrawer: () => void;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'WalletToolbar' });

const messages = defineMessages({
  openDrawerAriaLabel: {
    id: 'wallet-toolbar.open-drawer-aria-label',
    description: 'Accessibility label for open drawer icon',
    defaultMessage: 'Open drawer',
  },
});

const WalletToolbar = stylesDecorator(injectIntl(
  class extends React.Component<DecoratedProps> {
    render() {
      const { intl, classes } = this.props;

      return (
        <Toolbar>
          <IconButton
            className={classes.drawerIcon}
            aria-label={intl.formatMessage(
              messages.openDrawerAriaLabel)}
            color="inherit"
            onClick={this.props.onToggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="title" color="inherit" noWrap={true}>
            Title TODO
          </Typography>
        </Toolbar>
      );
    }
  }
));

export default WalletToolbar;
