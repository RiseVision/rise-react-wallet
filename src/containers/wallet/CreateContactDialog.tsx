import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import { addressBookCreateRoute } from '../../routes';
import Dialog from '../../components/Dialog';
import AddressBookStore from '../../stores/addressBook';
import RootStore, { RouteLink } from '../../stores/root';
import CreateContactDialogContent, { TSubmitData } from '../../components/content/CreateContactDialogContent';

interface Props {
  address?: string;
  navigateBackLink: RouteLink;
  open?: boolean;
}

interface InjectedProps extends Props {
  store: RootStore;
  routerStore: RouterStore;
  addressBookStore: AddressBookStore;
}

@inject('store')
@inject('routerStore')
@inject('addressBookStore')
@observer
class CreateContactDialog extends React.Component<Props> {
  address?: string;

  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleCreate = (data: TSubmitData) => {
    const { navigateBackLink, store, addressBookStore } = this.injected;
    addressBookStore.setContact(data.address, data.name);
    store.navigateTo(navigateBackLink);
  }

  checkAddressExists = (address: string): boolean => {
    return this.injected.addressBookStore.contacts.has(address);
  }

  render() {
    const { navigateBackLink, routerStore, open } = this.injected;

    const isOpen = open || routerStore.currentView === addressBookCreateRoute;
    if (isOpen) {
      this.address = this.injected.address;
    }

    return (
      <Dialog open={isOpen} onCloseRoute={navigateBackLink}>
        <CreateContactDialogContent
          checkAddressExists={this.checkAddressExists}
          address={this.address || undefined}
          onSubmit={this.handleCreate}
        />
      </Dialog>
    );
  }
}

export default CreateContactDialog;
