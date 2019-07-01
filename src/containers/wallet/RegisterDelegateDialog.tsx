import { reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import React from 'react';
import {
  ICloseInterruptController,
  ICloseInterruptControllerState
} from '../../components/Dialog';
import LedgerStore from '../../stores/ledger';
import ConfirmTransactionDialog from './ConfirmTransactionDialog';
import RegisterDelegateDialogContent from '../../components/content/RegisterDelegateDialogContent';
import { accountSettingsDelegateRoute } from '../../routes';
import RootStore, { RouteLink } from '../../stores/root';
import AccountStore, { LoadingState, AccountType } from '../../stores/account';
import WalletStore from '../../stores/wallet';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
  open?: boolean;
}

interface PropsInjected extends Props {
  store: RootStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
  ledgerStore: LedgerStore;
}

interface State extends ICloseInterruptControllerState {
  usernameInput: string;
  step: 'form' | 'transaction';
  transaction: null | {
    username: string;
  };
}

@inject('store')
@inject('routerStore')
@inject('walletStore')
@inject('ledgerStore')
@observer
class RegisterDelegateDialog extends React.Component<Props, State>
  implements ICloseInterruptController {
  disposeOpenMonitor: null | IReactionDisposer = null;
  state: State = {
    // TODO remove from state and pass when submitting the form
    usernameInput: '',
    step: 'form',
    transaction: null
  };

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  get account(): AccountStore {
    return this.injected.account;
  }

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    // @ts-ignore
    const tagName = ev.currentTarget.tagName;
    const isButton =
      tagName && tagName.toLowerCase() === 'button' && ev.type === 'click';

    if (this.state.formChanged && !isButton) {
      return true;
    }

    const { navigateBackLink, store } = this.injected;
    store.navigateTo(navigateBackLink);
    return false;
  };

  handleFormChanged = (changed: boolean) => {
    this.setState({ formChanged: changed });
  };

  handleNavigateBack = (ev: React.SyntheticEvent<{}>) => {
    this.setState({
      step: 'form',
      transaction: null
    });
  };

  handleUsernameChange = (username: string) => {
    this.setState({
      usernameInput: username
    });
  };

  handleUsernameCommit = () => {
    const { usernameInput } = this.state;

    // ledger requires to be open in a click handler
    if (this.account.type === AccountType.LEDGER) {
      this.injected.ledgerStore.open();
    }

    this.setState({
      step: 'transaction',
      transaction: {
        username: usernameInput
      }
    });
  };

  handleCreateTransaction = () => {
    const { account, walletStore } = this.injected;
    const { step, transaction } = this.state;

    if (step === 'transaction' && transaction !== null) {
      return walletStore.createRegisterDelegateTx(
        transaction.username,
        account.id
      );
    } else {
      throw new Error('Invalid internal state');
    }
  };

  resetState() {
    this.setState({
      usernameInput: '',
      step: 'form',
      transaction: null
    });
  }

  componentWillMount() {
    this.disposeOpenMonitor = reaction(
      () => this.isOpen,
      isOpen => {
        if (isOpen) {
          this.resetState();
        }
      }
    );

    this.resetState();
  }

  componentWillUnmount() {
    if (this.disposeOpenMonitor) {
      this.disposeOpenMonitor();
      this.disposeOpenMonitor = null;
    }
  }

  get isOpen() {
    const { routerStore, open } = this.injected;
    return open || routerStore.currentView === accountSettingsDelegateRoute;
  }

  render() {
    const { account, navigateBackLink } = this.injected;
    const { step, transaction } = this.state;

    const canGoBack = step !== 'form';

    return (
      <ConfirmTransactionDialog
        open={this.isOpen}
        account={account}
        transaction={
          transaction
            ? {
                kind: 'delegate',
                username: transaction.username
              }
            : null
        }
        onCreateTransaction={this.handleCreateTransaction}
        onClose={this.handleClose}
        onCloseRoute={navigateBackLink}
        onNavigateBack={canGoBack ? this.handleNavigateBack : undefined}
        children={this.renderDelegateContent()}
      />
    );
  }

  renderDelegateContent() {
    const { account, walletStore } = this.injected;
    const { usernameInput } = this.state;
    const { registeredDelegate } = account;
    const fee = walletStore.fees.get('delegate')!;

    if (account.registeredDelegateState === LoadingState.NOT_LOADED) {
      walletStore.loadRegisteredDelegate(account.id);
    }

    const regUsername = registeredDelegate ? registeredDelegate.username : '';
    return (
      <RegisterDelegateDialogContent
        onFormChanged={this.handleFormChanged}
        onSubmit={this.handleUsernameCommit}
        onClose={this.handleClose}
        onUsernameChange={this.handleUsernameChange}
        delegateFee={fee}
        registeredUsername={regUsername}
        forgingPK={account.forgingPK}
        username={usernameInput}
        error={
          !registeredDelegate && account.balance.lt(fee)
            ? 'insufficient-funds'
            : null
        }
      />
    );
  }
}

export default RegisterDelegateDialog;
