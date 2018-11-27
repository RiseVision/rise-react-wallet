import { Component, RefObject } from 'react';
import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import { accountSettingsNameRoute } from '../../routes';
import Dialog, {
  ICloseInterruptController
} from '../../components/Dialog';
import RootStore, { RouteLink } from '../../stores/root';
import AccountStore from '../../stores/account';
import AccountNameDialogContent from '../../components/content/AccountNameDialogContent';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
  open?: boolean;
}

interface InjectedProps extends Props {
  store: RootStore;
  routerStore: RouterStore;
}

interface State {
  formChanged: boolean;
}

@inject('store')
@inject('routerStore')
@observer
class AccountNameDialog extends React.Component<Props>
  implements ICloseInterruptController {
  state: State = {
    formChanged: false
  };

  protected get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleSubmit = (data: { name: string }) => {
    const { account, navigateBackLink, store } = this.injected;
    account.name = data.name;
    store.navigateTo(navigateBackLink);
  };

  handleClose = () => {
    return this.state.formChanged;
  };

  handleFormChanged = (changed: boolean) => {
    this.setState({ formChanged: changed });
  };

  render() {
    const { account, navigateBackLink, routerStore, open } = this.injected;

    const isOpen = open || routerStore.currentView === accountSettingsNameRoute;

    return (
      <Dialog
        open={isOpen}
        onCloseRoute={navigateBackLink}
        onClose={this.handleClose}
      >
        <AccountNameDialogContent
          onFormChanged={this.handleFormChanged}
          account={{
            name: account.name,
            address: account.id
          }}
          onSubmit={this.handleSubmit}
        />
      </Dialog>
    );
  }
}

export default AccountNameDialog;
