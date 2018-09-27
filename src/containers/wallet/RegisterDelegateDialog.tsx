import { reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import TransactionDialog from './TransactionDialog';
import RegisterDelegateDialogContent from '../../components/content/RegisterDelegateDialogContent';
import { accountSettingsDelegateRoute } from '../../routes';
import RootStore, { RouteLink } from '../../stores/root';
import AccountStore, { LoadingState } from '../../stores/account';
import WalletStore from '../../stores/wallet';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
}

interface PropsInjected extends Props {
  store: RootStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

interface State {
  usernameInput: string;
  step:
    | 'form'
    | 'transaction';
  transaction: null | {
    username: string;
  };
}

@inject('store')
@inject('routerStore')
@inject('walletStore')
@observer
class RegisterDelegateDialog extends React.Component<Props, State> {
  disposeOpenMonitor: null | IReactionDisposer = null;
  state: State = {
    usernameInput: '',
    step: 'form',
    transaction: null,
  };

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    const { navigateBackLink, store } = this.injected;
    store.navigateTo(navigateBackLink);
  }

  handleNavigateBack = (ev: React.SyntheticEvent<{}>) => {
    this.setState({
      step: 'form',
      transaction: null,
    });
  }

  handleUsernameChange = (username: string) => {
    this.setState({
      usernameInput: username,
    });
  }

  handleUsernameCommit = () => {
    const { usernameInput } = this.state;

    this.setState({
      step: 'transaction',
      transaction: {
        username: usernameInput,
      },
    });
  }

  handleCreateTransaction = () => {
    const { account, walletStore } = this.injected;
    const { step, transaction } = this.state;

    if (step === 'transaction' && transaction !== null) {
      return walletStore.createRegisterDelegateTx(
        transaction.username,
        account.id,
      );
    } else {
      throw new Error('Invalid internal state');
    }
  }

  resetState() {
    this.setState({
      usernameInput: '',
      step: 'form',
      transaction: null,
    });
  }

  componentWillMount() {
    this.disposeOpenMonitor = reaction(() => this.isOpen, (isOpen) => {
      if (isOpen) {
        this.resetState();
      }
    });

    this.resetState();
  }

  componentWillUnmount() {
    if (this.disposeOpenMonitor) {
      this.disposeOpenMonitor();
      this.disposeOpenMonitor = null;
    }
  }

  get isOpen() {
    const { routerStore } = this.injected;
    return routerStore.currentView === accountSettingsDelegateRoute;
  }

  render() {
    const { account, navigateBackLink } = this.injected;
    const { step, transaction } = this.state;

    const canGoBack = step !== 'form';

    return (
      <TransactionDialog
        open={this.isOpen}
        account={account}
        transaction={transaction ? {
          kind: 'delegate',
          username: transaction.username,
        } : null}
        onCreateTransaction={this.handleCreateTransaction}
        closeLink={navigateBackLink}
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
        onSubmit={this.handleUsernameCommit}
        onClose={this.handleClose}
        onUsernameChange={this.handleUsernameChange}
        delegateFee={fee}
        registeredUsername={regUsername}
        username={usernameInput}
        error={
          registeredDelegate
            ? 'already-registered'
            : account.balance.lt(fee)
              ? 'insufficient-funds'
              : null
        }
      />
    );
  }
}

export default RegisterDelegateDialog;
