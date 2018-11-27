import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import { accountSettingsRemoveRoute } from '../../routes';
import Dialog from '../../components/Dialog';
import RootStore, { RouteLink } from '../../stores/root';
import AccountStore from '../../stores/account';
import WalletStore from '../../stores/wallet';
import RemoveAccountDialogContent from '../../components/content/RemoveAccountDialogContent';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
  open?: boolean;
}

interface InjectedProps extends Props {
  store: RootStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

@inject('store')
@inject('walletStore')
@inject('routerStore')
@observer
class RemoveAccountDialog extends React.Component<Props> {
  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleSubmit = (saveContact: boolean) => {
    const { account, navigateBackLink, store, walletStore } = this.injected;
    walletStore.removeAccount(account.id);
    // save the contact to the address book
    if (saveContact) {
      walletStore.addressBook.contacts.set(account.id, account.name);
    }
    store.navigateTo(navigateBackLink);
  }

  render() {
    const { account, navigateBackLink, routerStore, open } = this.injected;

    const isOpen = open || routerStore.currentView === accountSettingsRemoveRoute;

    return (
      <Dialog
          open={isOpen}
          onCloseRoute={navigateBackLink}
      >
        <RemoveAccountDialogContent
          name={account.name}
          address={account.id}
          onSubmit={this.handleSubmit}
        />
      </Dialog>
    );
  }
}

export default RemoveAccountDialog;
