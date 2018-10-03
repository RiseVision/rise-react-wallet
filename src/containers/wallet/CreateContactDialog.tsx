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
  navigateBackLink: RouteLink;
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
  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleCreate = (data: TSubmitData) => {
    const { navigateBackLink, store, addressBookStore } = this.injected;
    addressBookStore.setContact(data.id, data.name);
    store.navigateTo(navigateBackLink);
  }

  checkAddressExists = (address: string): boolean => {
    return this.injected.addressBookStore.contacts.has(address);
  }

  render() {
    const { navigateBackLink, routerStore } = this.injected;

    const isOpen = routerStore.currentView === addressBookCreateRoute;

    return (
      <Dialog open={isOpen} closeLink={navigateBackLink}>
        <CreateContactDialogContent
            checkAddressExists={this.checkAddressExists}
            onSubmit={this.handleCreate}
        />
      </Dialog>
    );
  }
}

export default CreateContactDialog;
