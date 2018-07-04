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
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import AddIcon from '@material-ui/icons/Add';
import AccountIcon from '../components/AccountIcon';
import { Theme, createStyles, withStyles, WithStyles } from '@material-ui/core/styles';

const riseIcon = require('../images/rise_icon.svg');

const styles = (theme: Theme) => createStyles({
  toolbar: theme.mixins.toolbar,
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'normal',
    userSelect: 'none',
  },
  headerIcon: {
    margin: '-4px 4px',
  },
  selectedListItem: {
    backgroundColor: theme.palette.action.hover,
  },
  accountAvatar: {
    backgroundColor: 'white',
  },
  listIcon: {
    // Align the list icons to match the alignment of avatars
    marginLeft: 8,
    marginRight: 8,
  },
});

interface Props extends WithStyles<typeof styles> {
}

const stylesDecorator = withStyles(styles, { name: 'DrawerContent' });

const DrawerContent = stylesDecorator(
  class extends React.Component<Props> {
    render() {
      const { classes } = this.props;

      return (
        <React.Fragment>
          <Typography
            className={classNames(
              classes.toolbar,
              classes.header,
            )}
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
                ),
              }}
            />
          </Typography>
          <Divider />
          <List>
            <ListItem
              button={true}
              className={classNames(
                true && classes.selectedListItem,
              )}
            >
              <ListItemAvatar>
                <Avatar className={classes.accountAvatar}>
                  <AccountIcon size={24} address="3884823134173068029R" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Demo account"
                secondary="3884823134173068029R"
              />
            </ListItem>
            <ListItem button={true}>
              <ListItemAvatar>
                <Avatar className={classes.accountAvatar}>
                  <AccountIcon size={24} address="14310415683989235040R" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Unnamed account"
                secondary="14310415683989235040R"
              />
            </ListItem>
            <ListItem button={true}>
              <ListItemIcon className={classes.listIcon}>
                <AddIcon />
              </ListItemIcon>
              <ListItemText>
                <FormattedMessage
                  id="drawer-content.add-account"
                  description="Add account drawer item"
                  defaultMessage="Add an account"
                />
              </ListItemText>
            </ListItem>
          </List>
          <Divider />
          <List>
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
);

export default DrawerContent;