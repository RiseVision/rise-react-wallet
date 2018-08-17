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
import WalletStore, { TTransactionResult } from '../../stores/wallet';
import AccountContainer from './AccountContainer';

interface Props {
  routerStore?: RouterStore;
  walletStore?: WalletStore;
  onSubmit?: (tx?: TTransactionResult) => void;
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

@inject('routerStore')
@inject('walletStore')
@observer
// TODO should have an URL
export default class VoteTransaction extends AccountContainer<Props, State> {
  state: State = {
    step: 1,
    progress: ProgressState.TO_CONFIRM
  };

  onSubmit1 = (username: string) => {
    const { walletStore } = this.props;
    const { registeredDelegate } = this.account;
    const fee = walletStore!.fees.get('delegate')!;

    if (registeredDelegate || this.account.balance < fee) {
      this.onClose();
    } else {
      assert(username, 'Delegate\'s name required');
      // TODO validate the username
      this.setState({
        step: 2,
        username
      });
    }
  }

  onSend = async (state: ConfirmFormState) => {
    const { walletStore } = this.props;
    assert(this.state.username, 'Delegate\'s name required');
    // set in-progress
    this.setState({ progress: ProgressState.IN_PROGRESS });
    let tx: TTransactionResult;
    try {
      // TODO error msg
      tx = await walletStore!.registerDelegateTransaction(
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
  }

  onClose = async () => {
    // refresh the account after a successful transaction
    if (this.state.tx) {
      this.props.walletStore!.refreshAccount(this.account.id);
    }
    if (this.props.onSubmit) {
      this.props.onSubmit(this.state.tx);
    } else {
      // fallback
      this.props.routerStore!.goTo(accountOverviewRoute);
    }
  }

  render() {
    return this.state.step === 1 ? this.renderStep1() : this.renderStep2();
  }

  renderStep1() {
    // TODO assert that registeredDelegate is loaded (or load) before rendering
    const { walletStore } = this.props;
    const { registeredDelegate } = this.account;
    const fee = walletStore!.fees.get('delegate')!;

    const name = registeredDelegate ? registeredDelegate!.username : '';
    return (
      <RegisterDelegateForm
        onSubmit={this.onSubmit1}
        fee={fee}
        registeredUsername={name}
        error={
          registeredDelegate ? 'already-registered'
          : this.account.balance < fee ? 'insufficient-funds'
          : null
        }
      />
    );
  }

  renderStep2() {
    const { walletStore } = this.props;
    const { username } = this.state;
    // TODO translate 'Register Delegate', unify with the transaction table
    // TODO show the delegates name?
    return (
      <ConfirmTransactionForm
        isPassphraseSet={this.account.secondSignature}
        sender={this.account.name}
        senderId={this.account.id}
        fee={walletStore!.fees.get('delegate')!}
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
