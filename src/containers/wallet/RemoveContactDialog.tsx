import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { addressBookRemoveRoute } from '../../routes';
import Dialog from '../../components/Dialog';
import AddressBookStore from '../../stores/addressBook';
import RemoveContactDialogContent from '../../components/content/RemoveContactDialogContent';
import RouterStore, { RouteLink } from '../../stores/router';
import { normalizeAddress } from '../../utils/utils';

interface Props {
  navigateBackLink: RouteLink;
  open?: boolean;
}

interface InjectedProps extends Props {
  routerStore: RouterStore;
  addressBookStore: AddressBookStore;
}

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
    const { navigateBackLink, routerStore, addressBookStore } = this.injected;
    addressBookStore.contacts.delete(this.address);
    routerStore.navigateTo(navigateBackLink);
  }

  render() {
    const {
      navigateBackLink,
      routerStore,
      addressBookStore,
      open
    } = this.injected;

    const isOpen = open || routerStore.currentView === addressBookRemoveRoute;

    if (isOpen) {
      // Cache the data locally to prevent content changes when closing the dialog
      this.address = normalizeAddress(routerStore.params.id);
      this.name = addressBookStore.contacts.get(this.address) || '';
    }

    return (
      <Dialog open={isOpen} onCloseRoute={navigateBackLink}>
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
