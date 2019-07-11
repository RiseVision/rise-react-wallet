import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import React from 'react';
import ModifyContactDialogContent, { TSubmitData } from '../../components/content/ModifyContactDialogContent';
import Dialog, {
  ICloseInterruptControllerState,
  ICloseInterruptController
} from '../../components/Dialog';
import { addressBookModifyRoute } from '../../routes';
import AddressBookStore from '../../stores/addressBook';
import RouterStore, { RouteLink } from '../../stores/router';

interface Props {
  navigateBackLink: RouteLink;
  address?: string;
  open?: boolean;
}

interface InjectedProps extends Props {
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
export default class ModifyContactDialog extends React.Component<Props, State>
  implements ICloseInterruptController {
  // TODO move to state?
  address?: string;
  name?: string;

  state: State = {
    formChanged: false
  };

  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleEdit = (data: TSubmitData) => {
    const { navigateBackLink, routerStore, addressBookStore } = this.injected;
    addressBookStore.setContact(data.address, data.name);
    routerStore.navigateTo(navigateBackLink);
  }

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    // @ts-ignore
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
      <Dialog
        open={isOpen}
        onCloseRoute={navigateBackLink}
        onClose={this.handleClose}
      >
        <ModifyContactDialogContent
          onFormChanged={this.handleFormChanged}
          address={this.address || ''}
          name={this.name || ''}
          onSubmit={this.handleEdit}
        />
      </Dialog>
    );
  }
}
