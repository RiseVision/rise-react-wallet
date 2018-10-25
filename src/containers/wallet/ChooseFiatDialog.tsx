import * as React from 'react';
import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import { accountSettingsFiatRoute } from '../../routes';
import Dialog from '../../components/Dialog';
import AccountStore from '../../stores/account';
import RootStore, { RouteLink } from '../../stores/root';
import WalletStore from '../../stores/wallet';
import ChooseFiatDialogContent from '../../components/content/ChooseFiatDialogContent';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
  open?: boolean;
}

interface InjectedProps extends Props {
  store: RootStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

@inject('store')
@inject('routerStore')
@inject('walletStore')
@observer
class ChooseFiatDialog extends React.Component<Props> {
  private get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleChange = (data: { fiat: string; global: boolean }) => {
    const { account, navigateBackLink, store, walletStore } = this.injected;

    if (data.global) {
      for (const acc of walletStore.accounts.values()) {
        acc.fiatCurrency = data.fiat;
      }
    } else {
      account.fiatCurrency = data.fiat;
    }

    store.navigateTo(navigateBackLink);
  };

  render() {
    const {
      account,
      navigateBackLink,
      routerStore,
      walletStore,
      open
    } = this.injected;

    const isOpen = open || routerStore.currentView === accountSettingsFiatRoute;

    return (
      <Dialog open={isOpen} closeLink={navigateBackLink}>
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
