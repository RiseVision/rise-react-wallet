import * as assert from 'assert';
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
import { throttle } from 'lodash';

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
  selectedDelegate?: Delegate;
  addVote?: boolean;
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
    step: 1,
    query: ''
  };
  lastSearch = 0;

  componentWillMount() {
    // query for the recommended delegates
    this.loadActiveDelegates();
    // load the current vote (should come from settings)
    if (!this.props.walletStore!.votedDelegate) {
      this.props.walletStore!.loadVotedDelegate();
    }
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

  onSearch = throttle(
    async (query: string) => {
      const clock = ++this.lastSearch;
      if (!query || !query.trim()) {
        if (!this.state.activeDelegates.length) {
          return;
        }
        const active = this.state.activeDelegates;
        const rand = uniqueRandom(0, active.length - 1);
        this.setState({
          suggestedDelegates: [active[rand()], active[rand()], active[rand()]]
        });
        return;
      }
      const result = await this.props.walletStore!.searchDelegates(query);
      // check if there was a newer search
      if (this.lastSearch !== clock) {
        return;
      }
      this.setState({
        suggestedDelegates: result.slice(0, 3)
      });
    },
    500,
    { leading: false, trailing: true }
  );

  onSubmit1 = (delegate: Delegate, addVote: boolean) => {
    assert(delegate.publicKey, 'Delegate ID required');
    this.setState({
      selectedDelegate: delegate,
      step: 2,
      addVote
    });
  };

  onSubmit2 = async (state: ConfirmFormState) => {
    // TODO loading state
    // TODO validation
    const { store, walletStore } = this.props;
    assert(this.state.selectedDelegate, 'Delegate required');
    let txId = await walletStore!.voteTransaction(
      this.state.selectedDelegate.publicKey,
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
  };

  render() {
    return this.state.step === 1 ? this.renderStep1() : this.renderStep2();
  }

  renderStep1() {
    // TODO get the delegate(s) for the account
    const { votedDelegate } = this.props.walletStore!;
    return (
      <VoteTransactionForm
        onSubmit={this.onSubmit1}
        onSearch={this.onSearch}
        delegates={this.state.suggestedDelegates}
        votedDelegate={votedDelegate ? votedDelegate.publicKey : null}
      />
    );
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
