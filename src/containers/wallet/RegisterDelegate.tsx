import * as assert from 'assert';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import ConfirmTransactionForm, {
  ProgressState,
  State as ConfirmFormState
} from '../../components/forms/ConfirmTransactionForm';
import RegisterDelegateForm from '../../components/forms/RegisterDelegateForm';
import { accountOverviewRoute } from '../../routes';
import { accountStore } from '../../stores';
import AccountStore, { LoadingState } from '../../stores/account';
import WalletStore, { TTransactionResult } from '../../stores/wallet';

interface Props {
  onSubmit?: (tx?: TTransactionResult) => void;
  account?: AccountStore;
}

interface PropsInjected extends Props {
  accountStore: AccountStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

export interface State {
  step: number;
  username?: string;
  tx?: TTransactionResult;
  // progress state
  progress: ProgressState;
  // states data
  error?: string;
}

@inject(accountStore)
@inject('routerStore')
@inject('walletStore')
@observer
export default class RegisterDelegate extends React.Component<Props, State> {
  state: State = {
    step: 1,
    progress: ProgressState.TO_CONFIRM
  };

  get injected(): PropsInjected {
    // @ts-ignore
    return this.props;
  }

  get account() {
    return this.injected.account || this.injected.accountStore;
  }

  onSubmit1 = (username: string) => {
    const { walletStore } = this.injected;
    const { registeredDelegate } = this.account;
    const fee = walletStore.fees.get('delegate')!;

    if (registeredDelegate || this.account.balance < fee) {
      this.onClose();
    } else {
      assert(username, "Delegate's name required");
      // TODO validate the username
      this.setState({
        step: 2,
        username
      });
    }
  };

  onSend = async (state: ConfirmFormState) => {
    const { walletStore } = this.injected;
    assert(this.state.username, "Delegate's name required");
    // set in-progress
    this.setState({ progress: ProgressState.IN_PROGRESS });
    let tx: TTransactionResult;
    try {
      // TODO error msg
      tx = await walletStore.registerDelegateTransaction(
        this.state.username!,
        state.mnemonic,
        state.passphrase,
        this.account.id
      );
    } catch (e) {
      // TODO log the error
      tx = { success: false };
    }
    const progress = tx.success ? ProgressState.SUCCESS : ProgressState.ERROR;
    this.setState({ tx, progress });
  };

  onClose = async () => {
    // refresh the account after a successful transaction
    if (this.state.tx) {
      this.injected.walletStore.refreshAccount(this.account.id);
    }
    if (this.injected.onSubmit) {
      this.injected.onSubmit(this.state.tx);
    } else {
      // fallback
      this.injected.routerStore.goTo(accountOverviewRoute, {
        id: this.account.id
      });
    }
  };

  render() {
    return this.state.step === 1 ? this.renderStep1() : this.renderStep2();
  }

  renderStep1() {
    // make sure the existing delegate info is loaded
    if (this.account.registeredDelegateState === LoadingState.NOT_LOADED) {
      this.injected.walletStore.loadRegisteredDelegate(this.account.id);
    }
    const { walletStore } = this.injected;
    const { registeredDelegate } = this.account;
    const fee = walletStore.fees.get('delegate')!;

    const name = registeredDelegate ? registeredDelegate.username : '';
    return (
      <RegisterDelegateForm
        onSubmit={this.onSubmit1}
        fee={fee}
        registeredUsername={name}
        delegateLoaded={
          this.account.registeredDelegateState == LoadingState.LOADED
        }
        onClose={this.onClose}
        error={
          registeredDelegate
            ? 'already-registered'
            : this.account.balance < fee
              ? 'insufficient-funds'
              : null
        }
      />
    );
  }

  renderStep2() {
    const { walletStore } = this.injected;
    const { username } = this.state;
    return (
      <ConfirmTransactionForm
        isPassphraseSet={this.account.secondSignature}
        sender={this.account.name}
        senderId={this.account.id}
        fee={walletStore.fees.get('delegate')!}
        data={{
          kind: 'delegate',
          username: username!
        }}
        onSend={this.onSend}
        onRedo={this.onSend}
        onClose={this.onClose}
        progress={this.state.progress}
      />
    );
  }
}
