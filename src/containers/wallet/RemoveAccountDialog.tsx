import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import { accountSettingsRemoveRoute } from '../../routes';
import Dialog from '../../components/Dialog';
import RootStore, { RouteLink } from '../../stores/root';
import AccountStore from '../../stores/account';
import WalletStore from '../../stores/wallet';
import RemoveAccountDialogContent from '../../components/content/RemoveAccountDialogContent';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
}

interface InjectedProps extends Props {
  store: RootStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

@inject('store')
@inject('walletStore')
@inject('routerStore')
@observer
class RemoveAccountDialog extends React.Component<Props> {
  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleSubmit = () => {
    const { account, navigateBackLink, store, walletStore } = this.injected;
    walletStore.removeAccount(account.id);
    store.navigateTo(navigateBackLink);
  }

  render() {
    const { account, navigateBackLink, routerStore } = this.injected;

    const isOpen = routerStore.currentView === accountSettingsRemoveRoute;

    return (
      <Dialog
        open={isOpen}
        closeLink={navigateBackLink}
      >
        <RemoveAccountDialogContent
          name={account.name}
          address={account.id}
          onSubmit={this.handleSubmit}
        />
      </Dialog>
    );
  }
}

export default RemoveAccountDialog;
