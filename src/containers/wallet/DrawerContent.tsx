import Avatar from '@material-ui/core/Avatar';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import LayersIcon from '@material-ui/icons/Layers';
import PeopleIcon from '@material-ui/icons/People';
import * as classNames from 'classnames';
import { orderBy } from 'lodash';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import AccountIcon from '../../components/AccountIcon';
import { accountOverviewRoute, onboardingAddAccountRoute } from '../../routes';
import AccountStore from '../../stores/account';
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
    accountName: {
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
    listIcon: {
      // Align the list icons to match the alignment of avatars
      marginLeft: 8,
      marginRight: 8
    }
  });

interface Props extends WithStyles<typeof styles> {
}

interface PropsInjected extends Props {
  store: RootStore;
  walletStore: WalletStore;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'DrawerContent' });

const messages = defineMessages({
  unnamedAccountLabel: {
    id: 'drawer-content.unnamed-account-label',
    description: 'Label for accounts that user hasn\'t named yet',
    defaultMessage: 'Unnamed account',
  },
  accountsListAriaLabel: {
    id: 'drawer-content.accounts-list-aria-label',
    description: 'Accessibility label for the accounts section in the drawer',
    defaultMessage: 'Accounts',
  },
  navigationListAriaLabel: {
    id: 'drawer-content.navigation-list-aria-label',
    description: 'Accessibility label for the navigation section in the drawer',
    defaultMessage: 'Navigation',
  },
});

@inject('store')
@inject('walletStore')
@observer
class DrawerContent extends React.Component<DecoratedProps> {

  get injected(): PropsInjected & DecoratedProps {
    // @ts-ignore
    return this.props;
  }

  handleAccountClicked = (id: string) => () => {
    const { store, walletStore } = this.injected;
    walletStore.selectAccount(id);
    store.router.goTo(accountOverviewRoute, { id });
  }

  handleSignoutCliecked = () => {
    this.injected.walletStore.signout();
    this.injected.store.router.goTo(onboardingAddAccountRoute);
  }

  render() {
    const { intl, classes, store, walletStore } = this.injected;
    const unnamedAccountLabel = intl.formatMessage(
      messages.unnamedAccountLabel
    );
    const selected = walletStore.selectedAccount;

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
        <Divider aria-hidden={true} />
        <List aria-label={intl.formatMessage(messages.accountsListAriaLabel)}>
          {orderBy(
            [...walletStore.accounts.values()],
            ['pinned', 'name'],
            ['desc', 'asc']
          ).map((account: AccountStore) => (
            <ListItem
              button={true}
              className={classNames(
                selected &&
                  selected.id === account.id &&
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
              <ListItemText
                classes={{
                  primary: classes.accountName,
                }}
                primary={account.name || unnamedAccountLabel}
                secondary={account.id}
              />
            </ListItem>
          ))}
          <ListItem
            button={true}
            key="add-account"
            onClick={() => store.router.goTo(onboardingAddAccountRoute)}
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
        <Divider aria-hidden={true} />
        <List aria-label={intl.formatMessage(messages.navigationListAriaLabel)}>
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
          <ListItem button={true} onClick={this.handleSignoutCliecked}>
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

export default stylesDecorator(injectIntl(DrawerContent));
