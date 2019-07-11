import { action } from 'mobx';
import { inject, observer } from 'mobx-react';
import React from 'react';
import ChooseFiatDialogContent
  from '../../components/content/ChooseFiatDialogContent';
import Dialog, {
  ICloseInterruptControllerState,
  ICloseInterruptController
} from '../../components/Dialog';
import { accountSettingsFiatRoute } from '../../routes';
import AccountStore from '../../stores/account';
import RouterStore, { RouteLink } from '../../stores/router';
import WalletStore from '../../stores/wallet';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
  open?: boolean;
}

interface InjectedProps extends Props {
  routerStore: RouterStore;
  walletStore: WalletStore;
}

interface State extends ICloseInterruptControllerState {}

@inject('routerStore')
@inject('walletStore')
@observer
class ChooseFiatDialog extends React.Component<Props, State>
  implements ICloseInterruptController {
  state: State = {};

  protected get injected(): InjectedProps {
    return this.props as InjectedProps;
  }

  @action
  handleSubmit = (data: { fiat: string; global: boolean }) => {
    const { account, navigateBackLink, routerStore, walletStore } = this.injected;

    if (data.global) {
      for (const acc of walletStore.accounts.values()) {
        acc.fiatCurrency = data.fiat;
      }
    } else {
      account.fiatCurrency = data.fiat;
    }

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
      account,
      navigateBackLink,
      routerStore,
      walletStore,
      open
    } = this.injected;

    const isOpen = open || routerStore.currentView === accountSettingsFiatRoute;

    return (
      <Dialog
        open={isOpen}
        onCloseRoute={navigateBackLink}
        onClose={this.handleClose}
      >
        <ChooseFiatDialogContent
          onFormChanged={this.handleFormChanged}
          key={account.id}
          fiat={account.fiatCurrency}
          options={walletStore.config.fiat_currencies}
          onSubmit={this.handleSubmit}
        />
      </Dialog>
    );
  }
}

export default ChooseFiatDialog;
