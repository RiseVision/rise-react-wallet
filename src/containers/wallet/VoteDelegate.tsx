import * as assert from 'assert';
import { Delegate } from 'dpos-api-wrapper';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import ConfirmTransactionForm, {
  ProgressState,
  State as ConfirmFormState
} from '../../components/forms/ConfirmTransactionForm';
import { accountOverviewRoute } from '../../routes';
import RootStore from '../../stores/root';
import WalletStore, { TAccount, TTransactionResult } from '../../stores/wallet';
import VoteTransactionForm from '../../components/forms/VoteDelegateForm';
import { uniqueRandom } from '../../utils/utils';
import { throttle } from 'lodash';

interface Props {
  store?: RootStore;
  walletStore?: WalletStore;
  onSubmit?: (tx?: TTransactionResult) => void;
  account?: TAccount;
}

export interface State {
  step: number;
  activeDelegates: Delegate[];
  suggestedDelegates: Delegate[];
  selectedDelegate?: Delegate;
  addVote?: boolean;
  query: string;
  tx?: TTransactionResult;
  // progress state
  progress: ProgressState;
  // states data
  error?: string;
}

@inject('walletStore')
@observer
// TODO should have an URL
export default class VoteDelegate extends React.Component<Props, State> {
  state: State = {
    suggestedDelegates: [],
    activeDelegates: [],
    step: 1,
    query: '',
    progress: ProgressState.TO_CONFIRM
  };
  lastSearch = 0;

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
  }

  onSend = async (state: ConfirmFormState) => {
    const { walletStore } = this.props;
    assert(this.state.selectedDelegate, 'Delegate required');
    // set in-progress
    this.setState({ progress: ProgressState.IN_PROGRESS });
    let tx: TTransactionResult;
    try {
      // TODO error msg
      tx = await walletStore!.voteTransaction(
        this.state.selectedDelegate!.publicKey,
        state.mnemonic,
        state.passphrase,
        this.props.account
      );
    } catch (e) {
      tx = { success: false };
    }
    const progress = tx.success ? ProgressState.SUCCESS : ProgressState.ERROR;
    this.setState({ tx, progress });
  }

  onClose = async () => {
    if (this.props.onSubmit) {
      this.props.onSubmit(this.state.tx);
    } else {
      // fallback
      this.props.store!.router.goTo(accountOverviewRoute);
    }
  }

  componentWillMount() {
    // query for the recommended delegates
    this.loadActiveDelegates();
    // load the current vote (should come from settings)
    if (this.props.walletStore!.votedDelegate === undefined) {
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

  render() {
    return this.state.step === 1 ? this.renderStep1() : this.renderStep2();
  }

  renderStep1() {
    const { votedDelegate } = this.props.walletStore!;
    return (
      <VoteTransactionForm
        onSubmit={this.onSubmit1}
        onSearch={this.onSearch}
        delegates={this.state.suggestedDelegates}
        votedDelegate={votedDelegate ? votedDelegate!.publicKey : null}
      />
    );
  }

  renderStep2() {
    const { walletStore } = this.props;
    const account = this.props.account! || walletStore!.selectedAccount!;
    // TODO translate 'Cast Vote', unify with the transaction table
    // TODO show the delegates name?
    return (
      <ConfirmTransactionForm
        isPassphraseSet={account.secondSignature}
        sender={account.name}
        senderId={account.id}
        recipient={'Cast Vote'}
        amount={0}
        fee={walletStore!.fees.get('vote')!}
        onSend={this.onSend}
        onRedo={this.onSend}
        onClose={this.onClose}
        progress={this.state.progress}
      />
    );
  }
}
