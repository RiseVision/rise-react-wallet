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
  onSubmit?: (txId: string) => void;
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
    return <RegisterDelegateForm onSubmit={this.onSubmit1} />;
  }

  renderStep2() {
    const { walletStore } = this.props;
    const account = this.props.account! || walletStore!.selectedAccount!;
    // TODO translate 'recipient'
    // TODO show the delegates name?
    return (
      <ConfirmTransactionForm
        isPassphraseSet={account.secondSignature}
        sender={account.name}
        senderId={account.id}
        recipient={'case vote'}
        amount={0}
        fee={walletStore!.fees.get('vote')!}
        onSubmit={this.onSubmit2}
      />
    );
  }
}
