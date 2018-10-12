import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import { addressBookRemoveRoute } from '../../routes';
import Dialog from '../../components/Dialog';
import RootStore, { RouteLink } from '../../stores/root';
import AddressBookStore from '../../stores/addressBook';
import RemoveContactDialogContent from '../../components/content/RemoveContactDialogContent';
import { normalizeAddress } from '../../utils/utils';

interface Props {
  navigateBackLink: RouteLink;
}

interface InjectedProps extends Props {
  store: RootStore;
  routerStore: RouterStore;
  addressBookStore: AddressBookStore;
}

@inject('store')
@inject('addressBookStore')
@inject('routerStore')
@observer
class RemoveContactDialog extends React.Component<Props> {
  address = '';
  name = '';

  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleConfirm = () => {
    const { navigateBackLink, store, addressBookStore } = this.injected;
    addressBookStore.contacts.delete(this.address);
    store.navigateTo(navigateBackLink);
  }

  render() {
    const { navigateBackLink, routerStore, addressBookStore } = this.injected;

    const isOpen = routerStore.currentView === addressBookRemoveRoute;

    if (isOpen) {
      // Cache the data locally to prevent content changes when closing the dialog
      this.address = normalizeAddress(routerStore.params.id);
      this.name = addressBookStore.contacts.get(this.address) || '';
    }

    return (
      <Dialog
        open={isOpen}
        closeLink={navigateBackLink}
      >
        <RemoveContactDialogContent
          address={this.address}
          name={this.name}
          onConfirm={this.handleConfirm}
        />
      </Dialog>
    );
  }
}

export default RemoveContactDialog;