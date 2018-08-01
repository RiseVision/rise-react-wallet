import { inject, observer } from 'mobx-react';
import * as React from 'react';
import ConfirmTransactionForm, {
  State as ConfirmFormState
} from '../../components/forms/ConfirmTransactionForm';
import { accountOverviewRoute } from '../../routes';
import RootStore from '../../stores/root';
import WalletStore, { TAccount } from '../../stores/wallet';
import VoteTransactionForm, {
  State as VoteFormState
} from '../../components/forms/VoteTransactionForm';
import SettingsDialog from './SettingsDialog';

interface Props {
  store?: RootStore;
  walletStore?: WalletStore;
  onSubmit?: (txId: string) => void;
  amount?: number;
  recipientId?: string;
  account?: TAccount;
}

export interface State {
  step: number;
  delegateId: string | null;
  txId?: number;
}

@inject('store')
@inject('walletStore')
@observer
// TODO should have an URL
export default class VoteTransaction extends React.Component<Props, State> {
  state: State = {
    delegateId: null,
    step: 1
  };

  onSubmit1 = (state: VoteFormState) => {
    if (!state.selectedId) {
      throw new Error('Delegate ID required');
    }
    this.setState({
      delegateId: state.selectedId,
      step: 2
    });
  }

  onSubmit2 = async (state: ConfirmFormState) => {
    // TODO loading state
    // TODO validation
    const { store, walletStore } = this.props;
    let txId = await walletStore!.voteTransaction(
      state.mnemonic,
      state.passphrase,
      this.props.account && this.props.account.id
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

  onDialogClose = () => {
    const { store } = this.props;
    store!.router.goTo(accountOverviewRoute);
  }

  render() {
    const title = this.state.step === 1 ? 'Send RISE' : 'Confirm transaction';
    const content =
      this.state.step === 1 ? this.renderStep1() : this.renderStep2();

    return (
      <SettingsDialog title={title} open={true} onClose={this.onDialogClose}>
        {content}
      </SettingsDialog>
    );
  }

  renderStep1() {
    const { walletStore } = this.props;
    const balance =
      (this.props.account! && this.props.account!.balance) ||
      (walletStore!.selectedAccount! && walletStore!.selectedAccount!.balance) ||
      0;
    // TODO validate the recipient
    return (
      <VoteTransactionForm
        amount={this.props.amount || 0}
        fee={walletStore!.fees.get('send')!}
        balance={balance}
        onSubmit={this.onSubmit1}
        recipientId={this.props.recipientId}
      />
    );
  }

  renderStep2() {
    const { walletStore } = this.props;
    const account = this.props.account! || walletStore!.selectedAccount!;
    return (
      <ConfirmTransactionForm
        isPassphraseSet={account.secondSignature}
        sender={account.name}
        senderId={account.id}
        recipientId={this.state.recipientId!}
        recipient={walletStore!.idToName(this.state.recipientId!)}
        amount={this.state.amount!}
        fee={walletStore!.fees.get('send')!}
        onSubmit={this.onSubmit2}
      />
    );
  }
}
