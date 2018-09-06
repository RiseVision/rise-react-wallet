import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import { accountSettingsFiatRoute } from '../../routes';
import Dialog from '../../components/Dialog';
import AccountStore from '../../stores/account';
import WalletStore from '../../stores/wallet';
import ChooseFiatDialogContent from '../../components/content/ChooseFiatDialogContent';

interface Props {
  account: AccountStore;
  onNavigateBack: () => void;
}

interface InjectedProps extends Props {
  routerStore: RouterStore;
  walletStore: WalletStore;
}

@inject('routerStore')
@inject('walletStore')
@observer
class ChooseFiatDialog extends React.Component<Props> {
  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleChange = (data: { fiat: string; global: boolean }) => {
    const { account, onNavigateBack, walletStore } = this.injected;

    if (data.global) {
      for (const acc of walletStore.accounts.values()) {
        acc.fiatCurrency = data.fiat;
      }
    } else {
      account.fiatCurrency = data.fiat;
    }

    onNavigateBack();
  }

  render() {
    const {
      account,
      onNavigateBack,
      routerStore,
      walletStore,
    } = this.injected;

    const isOpen = routerStore.currentView === accountSettingsFiatRoute;

    return (
      <Dialog
        open={isOpen}
        onClose={onNavigateBack}
      >
        <ChooseFiatDialogContent
          key={account.id}
          fiat={account.fiatCurrency}
          options={walletStore.config.fiat_currencies}
          onChange={this.handleChange}
        />
      </Dialog>
    );
  }
}

export default ChooseFiatDialog;