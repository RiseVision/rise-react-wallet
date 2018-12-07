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
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import PeopleIcon from '@material-ui/icons/People';
import * as classNames from 'classnames';
import { orderBy } from 'lodash';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import {
  defineMessages,
  FormattedMessage,
  InjectedIntlProps,
  injectIntl
} from 'react-intl';
import AccountIcon from '../../components/AccountIcon';
import Link from '../../components/Link';
import {
  accountOverviewRoute,
  onboardingAddAccountRoute,
  addressBookRoute,
  accountsListRoute
} from '../../routes';
import { RouteLink } from '../../stores/root';
import AccountStore from '../../stores/account';
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
      backgroundColor: 'white',
      border: '2px solid white',
    },
    accountAvatarSelected: {
      borderColor: theme.palette.primary.dark,
    },
    accountName: {
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden'
    },
    listIcon: {
      // Align the list icons to match the alignment of avatars
      marginLeft: 8,
      marginRight: 8
    }
  });

interface Props extends WithStyles<typeof styles> {
  onSignOutClick: () => void;
  onAfterNavigate?: RouteLink['onAfterNavigate'];
}

type DecoratedProps = Props & InjectedIntlProps;

interface PropsInjected extends DecoratedProps {
  routerStore: RouterStore;
  walletStore: WalletStore;
}

const stylesDecorator = withStyles(styles, { name: 'DrawerContent' });

const messages = defineMessages({
  unnamedAccountLabel: {
    id: 'drawer-content.unnamed-account-label',
    description: 'Label for accounts that user hasn\'t named yet',
    defaultMessage: 'Unnamed account'
  },
  accountsListAriaLabel: {
    id: 'drawer-content.accounts-list-aria-label',
    description: 'Accessibility label for the accounts section in the drawer',
    defaultMessage: 'Accounts'
  },
  navigationListAriaLabel: {
    id: 'drawer-content.navigation-list-aria-label',
    description: 'Accessibility label for the navigation section in the drawer',
    defaultMessage: 'Navigation'
  }
});

@inject('routerStore')
@inject('walletStore')
@observer
class DrawerContent extends React.Component<DecoratedProps> {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  accountList() {
    const { walletStore } = this.injected;

    const list = orderBy(
      [...walletStore.accounts.values()],
      ['pinned', 'name'],
      ['desc', 'asc']
    ).splice(0, walletStore.config.max_drawer_accounts);

    // if the selected is in the overflow, replace the last one with it
    if (!list.includes(walletStore.selectedAccount)) {
      list.splice(list.length - 1, 1, walletStore.selectedAccount);
    }

    return list;
  }

  render() {
    const {
      intl,
      classes,
      onAfterNavigate,
      onSignOutClick,
      routerStore,
      walletStore
    } = this.injected;

    const unnamedAccountLabel = intl.formatMessage(
      messages.unnamedAccountLabel
    );
    const { selectedAccount } = walletStore;

    let selection: 'addressBook' | 'account' = 'account';
    if (routerStore.currentView.path.startsWith('/address-book')) {
      selection = 'addressBook';
    }

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
          {this.accountList().map((account: AccountStore) => (
            <Link
              key={account.id}
              route={accountOverviewRoute}
              params={{
                id: account.id
              }}
              onAfterNavigate={onAfterNavigate}
            >
              <ListItem
                className={classNames(
                  selection === 'account' &&
                    selectedAccount &&
                    routerStore.currentView !== accountsListRoute &&
                    selectedAccount.id === account.id &&
                    classes.selectedListItem
                )}
                button={true}
              >
                <ListItemAvatar>
                  <Avatar
                    className={classNames(
                      classes.accountAvatar,
                      selectedAccount && selectedAccount.id === account.id
                        ? classes.accountAvatarSelected : null,
                    )}
                  >
                    <AccountIcon size={24} address={account.id} />
                  </Avatar>
                </ListItemAvatar>
                {/* TODO this doesnt observe */}
                <ListItemText
                  classes={{
                    primary: classes.accountName
                  }}
                  primary={account.name || unnamedAccountLabel}
                  secondary={account.id}
                />
              </ListItem>
            </Link>
          ))}
          {walletStore.accounts.size <=
            walletStore.config.max_drawer_accounts && (
            <Link
              key="add-account"
              route={onboardingAddAccountRoute}
              onAfterNavigate={onAfterNavigate}
            >
              <ListItem button={true}>
                <ListItemAvatar>
                  <Avatar>
                    <AddIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText>
                  <FormattedMessage
                    id="drawer-content.add-an-account"
                    description="Add account drawer item"
                    defaultMessage="Add an account"
                  />
                </ListItemText>
              </ListItem>
            </Link>
          )}
          {walletStore.accounts.size >
            walletStore.config.max_drawer_accounts && (
            <Link
              key="more-accounts"
              route={accountsListRoute}
              onAfterNavigate={onAfterNavigate}
            >
              <ListItem
                className={classNames(
                  routerStore.currentView === accountsListRoute &&
                    classes.selectedListItem
                )}
                button={true}
              >
                <ListItemAvatar>
                  <Avatar>
                    <AccountBalanceWalletIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText>
                  <FormattedMessage
                    id="drawer-content.all-accounts"
                    description="All accounts drawer item"
                    defaultMessage="All accounts"
                  />
                </ListItemText>
              </ListItem>
            </Link>
          )}
        </List>
        <Divider aria-hidden={true} />
        <List aria-label={intl.formatMessage(messages.navigationListAriaLabel)}>
          <Link route={addressBookRoute} onAfterNavigate={onAfterNavigate}>
            <ListItem
              className={classNames(
                selection === 'addressBook' && classes.selectedListItem
              )}
              button={true}
            >
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
          </Link>
          {/*<ListItem button={true}>
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
          </ListItem>*/}
          <ListItem button={true} onClick={onSignOutClick}>
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
