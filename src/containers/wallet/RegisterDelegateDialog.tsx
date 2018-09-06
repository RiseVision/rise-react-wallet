import { reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import TransactionDialog, { Secrets } from './TransactionDialog';
import RegisterDelegateDialogContent from '../../components/content/RegisterDelegateDialogContent';
import { accountSettingsDelegateRoute } from '../../routes';
import AccountStore, { LoadingState } from '../../stores/account';
import WalletStore from '../../stores/wallet';

interface Props {
  account: AccountStore;
  onNavigateBack: () => void;
}

interface PropsInjected extends Props {
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
    const { onNavigateBack } = this.injected;
    onNavigateBack();
  }

  handleNavigateBack = (ev: React.SyntheticEvent<{}>) => {
    const { onNavigateBack } = this.injected;
    const { step } = this.state;

    if (step === 'form') {
      onNavigateBack();
    } else {
      this.setState({
        step: 'form',
        transaction: null,
      });
    }
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

  handleSendTransaction = (secrets: Secrets) => {
    const { account, walletStore } = this.injected;
    const { step, transaction } = this.state;

    if (step === 'transaction' && transaction !== null) {
      return walletStore.registerDelegateTransaction(
        transaction.username,
        secrets.mnemonic,
        secrets.passphrase!,
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
    const { account } = this.injected;
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
        onSendTransaction={this.handleSendTransaction}
        onClose={this.handleClose}
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