import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import CreateContactDialogContent, {
  TSubmitData
} from '../../components/content/CreateContactDialogContent';
import Dialog, {
  ICloseInterruptControllerState,
  ICloseInterruptController
} from '../../components/Dialog';
import { addressBookCreateRoute } from '../../routes';
import AddressBookStore from '../../stores/addressBook';
import RootStore, { RouteLink } from '../../stores/root';

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

interface State extends ICloseInterruptControllerState {
  formChanged: boolean;
}

@inject('store')
@inject('routerStore')
@inject('addressBookStore')
@observer
class CreateContactDialog extends React.Component<Props, State>
  implements ICloseInterruptController {
  // TODO move to state
  address?: string;
  state: State = {
    formChanged: false
  };

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

  handleClose = (ev: React.KeyboardEvent) => {
    const tagName = ev.currentTarget.tagName;
    const isButton =
      tagName && tagName.toLowerCase() === 'button' && ev.type === 'click';

    if (this.state.formChanged && !isButton) {
      return true;
    }
    return false;
  }

  handleFormChanged = (changed: boolean) => {
    this.setState({ formChanged: changed });
  }

  render() {
    const { navigateBackLink, routerStore, open } = this.injected;

    const isOpen = open || routerStore.currentView === addressBookCreateRoute;
    if (isOpen) {
      this.address = this.injected.address;
    }

    // TODO required to keep the proper context, see #235
    const onClose = this.handleClose.bind(this);
    return (
      <Dialog
        open={isOpen}
        onCloseRoute={navigateBackLink}
        onClose={onClose}
      >
        <CreateContactDialogContent
          onFormChanged={this.handleFormChanged}
          checkAddressExists={this.checkAddressExists}
          address={this.address || undefined}
          onSubmit={this.handleCreate}
        />
      </Dialog>
    );
  }
}

export default CreateContactDialog;
