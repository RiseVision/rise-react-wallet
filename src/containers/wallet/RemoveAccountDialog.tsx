import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import React from 'react';
import RemoveAccountDialogContent from '../../components/content/RemoveAccountDialogContent';
import Dialog from '../../components/Dialog';
import { accountSettingsRemoveRoute } from '../../routes';
import AccountStore from '../../stores/account';
import RouterStore, { RouteLink } from '../../stores/router';
import WalletStore from '../../stores/wallet';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
  open?: boolean;
}

interface InjectedProps extends Props {
  routerStore: RouterStore;
  walletStore: WalletStore;
}

@inject('walletStore')
@inject('routerStore')
@observer
class RemoveAccountDialog extends React.Component<Props> {
  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleSubmit = (saveContact: boolean) => {
    const {
      account,
      navigateBackLink,
      routerStore,
      walletStore
    } = this.injected;
    walletStore.removeAccount(account.id);
    // save the contact to the address book
    if (saveContact) {
      walletStore.addressBook.contacts.set(account.id, account.name);
    }
    routerStore.navigateTo(navigateBackLink);
  };

  render() {
    const { account, navigateBackLink, routerStore, open } = this.injected;

    const isOpen =
      open || routerStore.currentView === accountSettingsRemoveRoute;

    return (
      <Dialog open={isOpen} onCloseRoute={navigateBackLink}>
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
