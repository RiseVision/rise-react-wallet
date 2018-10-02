import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import { addressBookModifyRoute } from '../../routes';
import Dialog from '../../components/Dialog';
import AddressBookStore from '../../stores/addressBook';
import RootStore, { RouteLink } from '../../stores/root';
import CreateContactDialogContent, {
  TSubmitData
} from '../../components/content/CreateContactDialogContent';

interface Props {
  navigateBackLink: RouteLink;
  id?: string;
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
  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleEdit = (data: TSubmitData) => {
    const { navigateBackLink, store, addressBookStore } = this.injected;
    addressBookStore.setContact(data.id, data.name);
    store.navigateTo(navigateBackLink);
  }

  render() {
    const { navigateBackLink, routerStore, addressBookStore } = this.injected;

    const id = this.injected.id || routerStore.params.id;
    const isOpen = routerStore.currentView === addressBookModifyRoute;
    const name = addressBookStore.contacts.get(id);

    return (
      <Dialog open={isOpen} closeLink={navigateBackLink}>
        <CreateContactDialogContent
          id={id}
          name={name}
          onSubmit={this.handleEdit}
        />
      </Dialog>
    );
  }
}
