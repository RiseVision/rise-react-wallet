import { Delegate } from 'dpos-api-wrapper';
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
import { uniqueRandom } from '../../utils/utils';

interface Props {
  store?: RootStore;
  walletStore?: WalletStore;
  onSubmit?: (txId: string) => void;
  account?: TAccount;
}

export interface State {
  step: number;
  activeDelegates: Delegate[];
  suggestedDelegates: Delegate[];
  delegateId: string | null;
  query: string;
  txId?: number;
}

@inject('walletStore')
@observer
// TODO should have an URL
export default class VoteTransaction extends React.Component<Props, State> {
  state: State = {
    suggestedDelegates: [],
    activeDelegates: [],
    delegateId: null,
    step: 1,
    query: ''
  };

  componentWillMount() {
    // query for the recommended delegates
    this.loadActiveDelegates();
  }

  async loadActiveDelegates() {
    const api = this.props.walletStore!.dposAPI;
    const res = await api.delegates.getList();
    this.setState({ activeDelegates: res.delegates });
    // recommend random from active in the beginning
    if (!this.state.query) {
      this.onSearch('');
    }
  }

  // TODO throttle
  onSearch = async (query: string) => {
    if (!query || !query.trim()) {
      if (!this.state.activeDelegates.length) {
        return;
      }
      const active = this.state.activeDelegates;
      const rand = uniqueRandom(0, active.length - 1);
      this.setState({
        suggestedDelegates: [active[rand()], active[rand()], active[rand()]]
      });
      return
    }
    const result = await this.props.walletStore!.searchDelegates(query);
    this.setState({
      suggestedDelegates: result.slice(0, 3)
    });
  };

  onSubmit1 = (state: VoteFormState) => {
    if (!state.selectedId) {
      throw new Error('Delegate ID required');
    }
    this.setState({
      delegateId: state.selectedId,
      step: 2
    });
  };

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
  };

  render() {
    return this.state.step === 1 ? this.renderStep1() : this.renderStep2();
  }

  renderStep1() {
    const { walletStore } = this.props;
    const balance =
      (this.props.account! && this.props.account!.balance) ||
      (walletStore!.selectedAccount! &&
        walletStore!.selectedAccount!.balance) ||
      0;
    // TODO validate the recipient
    return (
      <VoteTransactionForm
        onSubmit={this.onSubmit1}
        onSearch={this.onSearch}
        delegates={this.state.suggestedDelegates}
      />
    );
  }

  renderStep2() {
    const { walletStore } = this.props;
    const account = this.props.account! || walletStore!.selectedAccount!;
    // TODO translate 'recipient'
    return (
      <ConfirmTransactionForm
        isPassphraseSet={account.secondSignature}
        sender={account.name}
        senderId={account.id}
        recipient={'Vote Delegate'}
        amount={0}
        fee={walletStore!.fees.get('vote')!}
        onSubmit={this.onSubmit2}
      />
    );
  }
}
