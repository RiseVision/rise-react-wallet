import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import { accountSettingsRemoveRoute } from '../../routes';
import Dialog from '../../components/Dialog';
import AccountStore from '../../stores/account';
import WalletStore from '../../stores/wallet';
import RemoveAccountDialogContent from '../../components/content/RemoveAccountDialogContent';

interface Props {
  account: AccountStore;
  onNavigateBack: () => void;
}

interface InjectedProps extends Props {
  routerStore: RouterStore;
  walletStore: WalletStore;
}

@inject('walletStore')
@inject('routerStore')
@observer
class RemoveAccountDialog extends React.Component<Props> {
  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleSubmit = () => {
    const { account, onNavigateBack, walletStore } = this.injected;
    walletStore.removeAccount(account.id);
    onNavigateBack();
  }

  render() {
    const { account, onNavigateBack, routerStore } = this.injected;

    const isOpen = routerStore.currentView === accountSettingsRemoveRoute;

    return (
      <Dialog
        open={isOpen}
        onClose={onNavigateBack}
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
