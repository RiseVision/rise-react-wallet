import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import AccountNameDialogContent
  from '../../components/content/AccountNameDialogContent';
import Dialog, {
  ICloseInterruptController,
  ICloseInterruptControllerState
} from '../../components/Dialog';
import { accountSettingsNameRoute } from '../../routes';
import AccountStore from '../../stores/account';
import RootStore, { RouteLink } from '../../stores/root';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
  open?: boolean;
}

interface InjectedProps extends Props {
  store: RootStore;
  routerStore: RouterStore;
}

interface State extends ICloseInterruptControllerState {
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
  }

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    return Boolean(this.state.formChanged);
  }

  handleFormChanged = (changed: boolean) => {
    this.setState({ formChanged: changed });
  }

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
