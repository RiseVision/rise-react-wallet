import Avatar from '@material-ui/core/Avatar/Avatar';
import Button from '@material-ui/core/Button/Button';
import List from '@material-ui/core/List/List';
import ListItem from '@material-ui/core/ListItem/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText/ListItemText';
import {
  createStyles,
  Theme,
  withStyles,
  WithStyles
} from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip/Tooltip';
import AddIcon from '@material-ui/icons/Add';
import { orderBy } from 'lodash';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import { defineMessages, InjectedIntlProps, injectIntl } from 'react-intl';
import AccountIcon from '../../components/AccountIcon';
import Link from '../../components/Link';
import { accountOverviewRoute, onboardingAddAccountRoute } from '../../routes';
import AccountStore from '../../stores/account';
import AddressBookStore from '../../stores/addressBook';
import WalletStore from '../../stores/wallet';

const styles = (theme: Theme) =>
  createStyles({
    container: {},
    accountAvatar: {
      backgroundColor: 'white'
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
    defaultMessage: 'Unnamed account'
  },
  addAccountTooltip: {
    id: 'accounts-list.send-funds-fab-tooltip',
    description: 'Tooltip for add account floating action button',
    defaultMessage: 'Add Account'
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

    const unnamedAccountLabel = intl.formatMessage(
      messages.unnamedAccountLabel
    );

    return (
      <div className={classes.container}>
        <List aria-label={intl.formatMessage(messages.accountsListAriaLabel)}>
          {orderBy(
            [...walletStore.accounts.values()],
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
                  <Avatar className={classes.accountAvatar}>
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
        </List>{' '}
        <Tooltip
          placement="left"
          title={intl.formatMessage(messages.addAccountTooltip)}
        >
          <Link route={onboardingAddAccountRoute}>
            <Button variant="fab" className={classes.fab} color="secondary">
              <AddIcon />
            </Button>
          </Link>
        </Tooltip>
      </div>
    );
  }
}

export default stylesDecorator(injectIntl(AccountOverview));
