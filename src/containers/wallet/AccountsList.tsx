import Avatar from '@material-ui/core/es/Avatar';
import Fab from '@material-ui/core/es/Fab';
import List from '@material-ui/core/es/List/List';
import ListItem from '@material-ui/core/es/ListItem';
import ListItemAvatar from '@material-ui/core/es/ListItemAvatar';
import ListItemText from '@material-ui/core/es/ListItemText';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/es/styles';
import Tooltip from '@material-ui/core/es/Tooltip';
import AddIcon from '@material-ui/icons/Add';
import classNames from 'classnames';
import { orderBy } from 'lodash';
import { inject, observer } from 'mobx-react';
import RouterStore from '../../stores/router';
import React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import AccountIcon from '../../components/AccountIcon';
import Link from '../../components/Link';
import { accountOverviewRoute, onboardingAddAccountRoute } from '../../routes';
import AccountStore from '../../stores/account';
import AddressBookStore from '../../stores/addressBook';
import WalletStore from '../../stores/wallet';

const styles = (theme: Theme) =>
  createStyles({
    content: {
      backgroundColor: theme.palette.background.paper
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
    fab: {
      position: 'fixed',
      right: 3 * theme.spacing.unit,
      bottom: 3 * theme.spacing.unit,
      zIndex: 1100
    }
  });

interface Props extends WithStyles<typeof styles> {}

interface PropsInjected extends Props {
  routerStore: RouterStore;
  walletStore: WalletStore;
  addressBookStore: AddressBookStore;
}

type DecoratedProps = Props & InjectedIntlProps;

const stylesDecorator = withStyles(styles, { name: 'AccountOverview' });

const messages = defineMessages({
  accountsListAriaLabel: {
    id: 'accounts-list.accounts-list-aria-label',
    description:
      'Accessibility label for the accounts section in accounts list page',
    defaultMessage: 'Accounts'
  },
  unnamedAccountLabel: {
    id: 'accounts-list.unnamed-account-label',
    description: 'Label for accounts that user hasn\'t named yet',
    defaultMessage: 'Unnamed account ({id})'
  },
  addAccountTooltip: {
    id: 'accounts-list.add-account-fab-tooltip',
    description: 'Tooltip for add account floating action button',
    defaultMessage: 'Add an account'
  }
});

type State = {
  editContactID: string | null;
};

@inject('routerStore')
@inject('walletStore')
@observer
class AccountOverview extends React.Component<DecoratedProps, State> {
  state: State = {
    editContactID: null
  };

  get injected(): PropsInjected & DecoratedProps {
    // @ts-ignore
    return this.props;
  }

  render() {
    const { walletStore, classes, intl } = this.injected;
    const { selectedAccount } = walletStore;

    return (
      <div className={classes.content}>
        <List aria-label={intl.formatMessage(messages.accountsListAriaLabel)}>
          {orderBy(
            walletStore.listAccounts(),
            ['pinned', 'name'],
            ['desc', 'asc']
          ).map((account: AccountStore) => (
            <Link
              key={account.id}
              route={accountOverviewRoute}
              params={{
                id: account.id
              }}
            >
              <ListItem button={true}>
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
        </List>
        <Tooltip
          placement="left"
          title={intl.formatMessage(messages.addAccountTooltip)}
        >
          <Link route={onboardingAddAccountRoute}>
            <Fab classes={{ root: classes.fab }} color="secondary">
              <AddIcon />
            </Fab>
          </Link>
        </Tooltip>
      </div>
    );
  }
}

export default stylesDecorator(injectIntl(AccountOverview));
