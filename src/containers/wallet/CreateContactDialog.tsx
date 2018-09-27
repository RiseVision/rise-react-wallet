import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import { addressBookCreateRoute } from '../../routes';
import Dialog from '../../components/Dialog';
import RootStore, { RouteLink } from '../../stores/root';
import WalletStore from '../../stores/wallet';
import CreateContactDialogContent from '../../components/content/CreateContactDialogContent';

interface Props {
  navigateBackLink: RouteLink;
}

interface InjectedProps extends Props {
  store: RootStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

@inject('store')
@inject('routerStore')
@inject('walletStore')
@observer
class CreateContactDialog extends React.Component<Props> {
  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleCreate = (data: { name: string }) => {
    const { navigateBackLink, store } = this.injected;
    // TODO: Create new contact
    store.navigateTo(navigateBackLink);
  }

  checkAddressExists = (address: string): boolean => {
    // TODO: Verify address against address book
    const { walletStore } = this.injected;
    return walletStore.accounts.has(address);
  }

  render() {
    const { navigateBackLink, routerStore } = this.injected;

    const isOpen = routerStore.currentView === addressBookCreateRoute;

    return (
      <Dialog
        open={isOpen}
        closeLink={navigateBackLink}
      >
        <CreateContactDialogContent
          checkAddressExists={this.checkAddressExists}
          onCreate={this.handleCreate}
        />
      </Dialog>
    );
  }
}

export default CreateContactDialog;
