import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import { addressBookModifyRoute } from '../../routes';
import Dialog from '../../components/Dialog';
import AddressBookStore from '../../stores/addressBook';
import RootStore, { RouteLink } from '../../stores/root';
import ModifyContactDialogContent, {
  TSubmitData
} from '../../components/content/ModifyContactDialogContent';

interface Props {
  navigateBackLink: RouteLink;
  address?: string;
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
export default class ModifyContactDialog extends React.Component<Props> {
  address?: string;
  name?: string;

  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleEdit = (data: TSubmitData) => {
    const { navigateBackLink, store, addressBookStore } = this.injected;
    addressBookStore.setContact(data.address, data.name);
    store.navigateTo(navigateBackLink);
  }

  render() {
    const {
      navigateBackLink,
      routerStore,
      addressBookStore,
      open
    } = this.injected;

    const isOpen = open || routerStore.currentView === addressBookModifyRoute;
    if (isOpen) {
      // Cache the data locally to prevent content changes when closing the dialog
      this.address = this.injected.address || routerStore.params.id;
      this.name = addressBookStore.contacts.get(this.address);
    }

    return (
      <Dialog open={isOpen} onCloseRoute={navigateBackLink}>
        <ModifyContactDialogContent
          address={this.address || ''}
          name={this.name || ''}
          onSubmit={this.handleEdit}
        />
      </Dialog>
    );
  }
}
