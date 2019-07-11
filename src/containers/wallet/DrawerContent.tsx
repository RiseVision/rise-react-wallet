import Avatar from '@material-ui/core/es/Avatar';
import Divider from '@material-ui/core/es/Divider';
import List from '@material-ui/core/es/List';
import ListItem from '@material-ui/core/es/ListItem';
import ListItemAvatar from '@material-ui/core/es/ListItemAvatar';
import ListItemIcon from '@material-ui/core/es/ListItemIcon';
import ListItemText from '@material-ui/core/es/ListItemText';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/es/styles';
import Typography from '@material-ui/core/es/Typography';
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';
import AddIcon from '@material-ui/icons/Add';
import AppsIcon from '@material-ui/icons/Apps';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import PeopleIcon from '@material-ui/icons/People';
import UsbIcon from '@material-ui/icons/Usb';
import classNames from 'classnames';
import { orderBy } from 'lodash';
import { inject, observer } from 'mobx-react';
import React from 'react';
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
  accountsListRoute,
  onboardingInstallToHomeScreenRoute
} from '../../routes';
import AccountStore from '../../stores/account';
import LedgerStore from '../../stores/ledger';
import RouterStore, { RouteLink } from '../../stores/router';
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
      border: '2px solid white'
    },
    accountAvatarSelected: {
      borderColor: theme.palette.primary.dark
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
  ledgerStore: LedgerStore;
}

const stylesDecorator = withStyles(styles, { name: 'DrawerContent' });

const messages = defineMessages({
  unnamedAccountLabel: {
    id: 'drawer-content.unnamed-account-label',
    description: "Label for accounts that user hasn't named yet",
    defaultMessage: 'Unnamed account ({id})'
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
@inject('ledgerStore')
@observer
class DrawerContent extends React.Component<DecoratedProps> {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  accountList() {
    const { walletStore } = this.injected;
    const { selectedAccount } = walletStore;

    const allAccounts = orderBy(
      walletStore.listAccounts(),
      ['pinned', a => Boolean(a.name), 'name'],
      ['desc', 'desc', 'asc']
    );
    const pinnedCount = allAccounts.filter(a => a.pinned).length;

    const maxAccounts = Math.max(
      walletStore.config.max_drawer_accounts,
      pinnedCount
    );

    const list = allAccounts.splice(0, maxAccounts);

    // Make sure that the selected account is always visible...
    if (allAccounts.length > 1) {
      if (!list.includes(selectedAccount)) {
        if (!list[list.length - 1].pinned) {
          // ... either by replacing the last item with the selected account
          list.splice(list.length - 1, 1, selectedAccount);
        } else {
          // ... or appending it as the last item (we don't want to replace pinned accounts)
          list.push(selectedAccount);
        }
      }
    }

    return list;
  }

  handleUnmountLedger = () => {
    const { ledgerStore } = this.injected;
    ledgerStore.close();
    ledgerStore.forgetLastDevice();
  };

  render() {
    const {
      intl,
      classes,
      onAfterNavigate,
      onSignOutClick,
      routerStore,
      walletStore,
      ledgerStore
    } = this.injected;

    const { selectedAccount } = walletStore;

    let selection: 'addressBook' | 'account' = 'account';
    if (routerStore.currentView.path.startsWith('/address-book')) {
      selection = 'addressBook';
    }

    return (
      <>
        <Typography
          className={classNames(classes.toolbar, classes.header)}
          variant="h6"
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
                        ? classes.accountAvatarSelected
                        : null
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
                  primary={
                    account.name ||
                    intl.formatMessage(messages.unnamedAccountLabel, {
                      id: account.localId
                    })
                  }
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
          {walletStore.isMobile &&
            !walletStore.isHomeScreen && (
              <Link
                route={onboardingInstallToHomeScreenRoute}
                onAfterNavigate={onAfterNavigate}
              >
                <ListItem button={true}>
                  <ListItemIcon className={classes.listIcon}>
                    <AppsIcon />
                  </ListItemIcon>
                  <ListItemText>
                    <FormattedMessage
                      id="drawer-content.install-to-homescreen"
                      description="Install to homescreen drawer item"
                      defaultMessage="Install to Home Screen"
                    />
                  </ListItemText>
                </ListItem>
              </Link>
            )}
          {ledgerStore.lastDevice && (
            <ListItem button={true} onClick={this.handleUnmountLedger}>
              <ListItemIcon className={classes.listIcon}>
                <UsbIcon />
              </ListItemIcon>
              <ListItemText>
                <FormattedMessage
                  id="drawer-content.unmount-ledger"
                  description="Unmount a ledger device drawer item"
                  defaultMessage="Unmount Ledger"
                />
              </ListItemText>
            </ListItem>
          )}
          {!walletStore.isMobile &&
            walletStore.supportsA2HS &&
            !walletStore.isHomeScreen && (
              <Link
                route={onboardingInstallToHomeScreenRoute}
                onAfterNavigate={onAfterNavigate}
              >
                <ListItem button={true}>
                  <ListItemIcon className={classes.listIcon}>
                    <AppsIcon />
                  </ListItemIcon>
                  <ListItemText>
                    <FormattedMessage
                      id="drawer-content.install-to-desktop"
                      description="Install to desktop drawer item"
                      defaultMessage="Install to Desktop"
                    />
                  </ListItemText>
                </ListItem>
              </Link>
            )}
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
      </>
    );
  }
}

export default stylesDecorator(injectIntl(DrawerContent));
