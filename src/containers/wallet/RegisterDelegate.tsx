import * as assert from 'assert';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import ConfirmTransactionForm, {
  State as ConfirmFormState
} from '../../components/forms/ConfirmTransactionForm';
import RegisterDelegateForm from '../../components/forms/RegisterDelegateForm';
import { accountOverviewRoute } from '../../routes';
import RootStore from '../../stores/root';
import WalletStore, { TAccount } from '../../stores/wallet';

interface Props {
  store?: RootStore;
  walletStore?: WalletStore;
  onSubmit?: (txId?: string) => void;
  account?: TAccount;
}

export interface State {
  step: number;
  username?: string;
  txId?: number;
}

@inject('walletStore')
@observer
// TODO should have an URL
export default class VoteTransaction extends React.Component<Props, State> {
  state: State = {
    step: 1
  };

  onSubmit1 = (username: string) => {
    // cant change an already registered delegate
    if (this.props.walletStore!.registeredDelegate) {
      return this.props.onSubmit ? this.props.onSubmit() : undefined;
    }
    assert(username, 'Delegate\'s name required');
    // TODO validate the username
    this.setState({
      step: 2,
      username
    });
  }

  onSubmit2 = async (state: ConfirmFormState) => {
    // TODO loading state
    // TODO validation
    const { store, walletStore } = this.props;
    assert(this.state.username, 'Delegate\'s name required');
    let txId = await walletStore!.registerDelegateTransaction(
      this.state.username!,
      state.mnemonic,
      state.passphrase,
      this.props.account
    );
    if (this.props.onSubmit) {
      this.props.onSubmit(txId);
    } else {
      // TODO show the TransactionSend dialog
      this.setState({ step: this.state.step + 1 });
      // TODO use the same as the SendComponent
      store!.router.goTo(accountOverviewRoute);
    }
  }

  render() {
    return this.state.step === 1 ? this.renderStep1() : this.renderStep2();
  }

  renderStep1() {
    // TODO assert that registeredDelegate is loaded (or load) before rendering
    const { registeredDelegate } = this.props.walletStore!;
    const name = registeredDelegate ? registeredDelegate!.username : '';
    return <RegisterDelegateForm onSubmit={this.onSubmit1} username={name} />;
  }

  renderStep2() {
    const { walletStore } = this.props;
    const account = this.props.account! || walletStore!.selectedAccount!;
    // TODO translate 'Register Delegate', unify with the transaction table
    // TODO show the delegates name?
    return (
      <ConfirmTransactionForm
        isPassphraseSet={account.secondSignature}
        sender={account.name}
        senderId={account.id}
        recipient={'Register Delegate'}
        amount={0}
        fee={walletStore!.fees.get('delegate')!}
        onSubmit={this.onSubmit2}
      />
    );
  }
}
