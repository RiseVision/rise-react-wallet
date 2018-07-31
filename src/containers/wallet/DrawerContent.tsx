import { inject, observer } from 'mobx-react';
import * as React from 'react';
import * as classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import Divider from '@material-ui/core/Divider';
import Typography from '@material-ui/core/Typography';
import List from '@material-ui/core/List';
import Avatar from '@material-ui/core/Avatar';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import LayersIcon from '@material-ui/icons/Layers';
import PeopleIcon from '@material-ui/icons/People';
import SendIcon from '@material-ui/icons/Send';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import AddIcon from '@material-ui/icons/Add';
import AccountIcon from '../../components/AccountIcon';
import {
  Theme,
  createStyles,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import {
  accountOverviewRoute,
  accountSendRoute,
  onboardingAddAccountRoute
} from '../../routes';
import { orderBy } from 'lodash';
import RootStore from '../../stores/root';
import WalletStore from '../../stores/wallet';

const riseIcon = require('../../images/rise_icon.svg');

const styles = (theme: Theme) =>
  createStyles({
    toolbar: theme.mixins.toolbar,
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'normal',
      userSelect: 'none'
    },
    headerIcon: {
      margin: '-4px 4px'
    },
    selectedListItem: {
      backgroundColor: theme.palette.action.hover
    },
    accountAvatar: {
      backgroundColor: 'white'
    },
    listIcon: {
      // Align the list icons to match the alignment of avatars
      marginLeft: 8,
      marginRight: 8
    }
  });

interface Props extends WithStyles<typeof styles> {
  store?: RootStore;
  walletStore?: WalletStore;
}

const stylesDecorator = withStyles(styles, { name: 'DrawerContent' });

@inject('store')
@inject('walletStore')
@observer
class DrawerContent extends React.Component<Props> {
  handleAccountClicked = (id: string) => () => {
    const { store, walletStore } = this.props;
    walletStore!.selectAccount(id);
    store!.router.goTo(accountOverviewRoute);
  }

  render() {
    const { classes, store, walletStore } = this.props;

    return (
      <React.Fragment>
        <Typography
          className={classNames(classes.toolbar, classes.header)}
          variant="title"
          noWrap={true}
          align="center"
        >
          <FormattedMessage
            id="drawer-content.header"
            description="Drawer header title"
            defaultMessage="{icon} RISE wallet"
            values={{
              icon: (
                <img
                  className={classes.headerIcon}
                  src={riseIcon}
                  height={24}
                  alt=""
                />
              )
            }}
          />
        </Typography>
        <Divider />
        <List>
          {orderBy(
            walletStore!.accounts,
            ['pinned', 'name'],
            ['desc', 'asc']
          ).map(account => (
            <ListItem
              button={true}
              className={classNames(
                walletStore!.selectedAccount === account &&
                  classes.selectedListItem
              )}
              onClick={this.handleAccountClicked(account.id)}
              key={account.id}
            >
              <ListItemAvatar>
                <Avatar className={classes.accountAvatar}>
                  <AccountIcon size={24} address={account.id} />
                </Avatar>
              </ListItemAvatar>
              {/* TODO this doesnt observe */}
              <ListItemText primary={account.name} secondary={account.id} />
            </ListItem>
          ))}
          <ListItem
            button={true}
            key="add-account"
            onClick={() => store!.router.goTo(onboardingAddAccountRoute)}
          >
            <ListItemAvatar>
              <Avatar>
                {/* TODO correct the icon, FUT - mocks */}
                <AddIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Add an account" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem
            button={true}
            onClick={() => store!.router.goTo(accountSendRoute)}
          >
            <ListItemIcon className={classes.listIcon}>
              <SendIcon />
            </ListItemIcon>
            <ListItemText>
              <FormattedMessage
                id="drawer-content.send-transaction"
                defaultMessage="Send funds"
              />
            </ListItemText>
          </ListItem>
          <ListItem button={true}>
            <ListItemIcon className={classes.listIcon}>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText>
              <FormattedMessage
                id="drawer-content.address-book"
                description="Address book drawer item"
                defaultMessage="Address book"
              />
            </ListItemText>
          </ListItem>
          <ListItem button={true}>
            <ListItemIcon className={classes.listIcon}>
              <LayersIcon />
            </ListItemIcon>
            <ListItemText>
              <FormattedMessage
                id="drawer-content.block-explorer"
                description="Block explorer drawer item"
                defaultMessage="Block explorer"
              />
            </ListItemText>
          </ListItem>
          <ListItem button={true}>
            <ListItemIcon className={classes.listIcon}>
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText>
              <FormattedMessage
                id="drawer-content.sign-out"
                description="Sign out drawer item"
                defaultMessage="Sign out"
              />
            </ListItemText>
          </ListItem>
        </List>
      </React.Fragment>
    );
  }
}

// TODO convert to a TS decorator
export default stylesDecorator(DrawerContent);
