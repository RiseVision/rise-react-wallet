import * as assert from 'assert';
import { Delegate } from 'dpos-api-wrapper';
import { throttle, sampleSize } from 'lodash';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Dialog from '../../components/Dialog';
import ConfirmTransactionForm, {
  ProgressState,
  State as ConfirmFormState
} from '../../components/forms/ConfirmTransactionForm';
import VoteTransactionForm from '../../components/forms/VoteDelegateForm';
import { accountOverviewRoute } from '../../routes';
import { accountStore } from '../../stores';
import AccountStore, { LoadingState } from '../../stores/account';
import WalletStore, { TTransactionResult } from '../../stores/wallet';

interface Props {
  onSubmit?: (tx?: TTransactionResult) => void;
  account?: AccountStore;
  noDialog?: boolean;
}

interface PropsInjected extends Props {
  accountStore: AccountStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

export interface State {
  step: number;
  loadingDelegates: boolean;
  activeDelegates: Delegate[];
  displayedDelegates: Delegate[];
  selectedDelegate?: Delegate;
  addVote?: boolean;
  query: string;
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
// TODO should have an URL
export default class VoteDelegate extends React.Component<Props, State> {
  state: State = {
    loadingDelegates: false,
    displayedDelegates: [],
    activeDelegates: [],
    step: 1,
    query: '',
    progress: ProgressState.TO_CONFIRM
  };
  lastSearch = 0;

  get injected(): PropsInjected {
    // @ts-ignore
    return this.props;
  }

  get account() {
    return this.injected.account || this.injected.accountStore;
  }

  onSearch = throttle(
    async (query: string) => {
      const clock = ++this.lastSearch;

      if (!query) {
        if (!this.state.activeDelegates.length) {
          return;
        }
        const active = this.state.activeDelegates;
        this.setState({
          loadingDelegates: false,
          displayedDelegates: sampleSize(active, 3),
          query
        });
      } else {
        this.setState({
          loadingDelegates: true,
          query
        });
        const result = await this.injected.walletStore.searchDelegates(query);
        // check if there was a newer search
        if (this.lastSearch !== clock) {
          return;
        }
        this.setState({
          loadingDelegates: false,
          displayedDelegates: result.slice(0, 3)
        });
      }
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
    const { walletStore } = this.injected;
    assert(this.state.selectedDelegate, 'Delegate required');
    // set in-progress
    this.setState({ progress: ProgressState.IN_PROGRESS });
    let tx: TTransactionResult;
    try {
      // TODO error msg
      tx = await walletStore.voteTransaction(
        this.state.selectedDelegate!.publicKey,
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

  onBackClick = () => {
    if (this.state.step === 2) {
      this.setState({ step: 1 });
    }
  }

  onClose = async () => {
    // refresh the account after a successful transaction
    let tx = this.state.tx;
    if (tx && tx.success) {
      this.injected.walletStore.refreshAccount(this.account.id);
    }
    if (this.injected.onSubmit) {
      this.injected.onSubmit(tx);
    } else {
      // fallback
      this.injected.routerStore.goTo(accountOverviewRoute, {
        id: this.account
      });
    }
  }

  componentWillMount() {
    // query for the recommended delegates
    this.loadActiveDelegates();
    // load the current vote (settings should preload)
    if (this.account.votedDelegateState === LoadingState.NOT_LOADED) {
      this.injected.walletStore.loadVotedDelegate(this.account.id);
    }
  }

  async loadActiveDelegates() {
    const api = this.injected.walletStore.dposAPI;
    this.setState({ loadingDelegates: true });
    const res = await api.delegates.getList();
    this.setState({ activeDelegates: res.delegates });
    // recommend random from active in the beginning
    if (!this.state.query) {
      this.onSearch('');
    }
  }

  render() {
    let title;
    const step = this.state.step;
    const { progress } = this.state;
    const states = ProgressState;
    const inProgress = progress === states.IN_PROGRESS;
    const showBackButton =
      step === 2 &&
      (progress === states.ERROR || progress === states.TO_CONFIRM);

    if (step === 1) {
      title = (
        <FormattedMessage
          id="settings-dialog-title"
          defaultMessage={'Vote for Delegate'}
        />
      );
    } else {
      title = (
        <FormattedMessage
          id="settings-dialog-title"
          defaultMessage={'Confirm transaction'}
        />
      );
    }

    const content = step === 1 ? this.renderStep1() : this.renderStep2();
    if (this.props.noDialog) {
      return content;
    }

    return (
      <Dialog
        title={title}
        open={true}
        onClose={(!inProgress && this.onClose) || undefined}
        onBackClick={(showBackButton && this.onBackClick) || undefined}
      >
        {content}
      </Dialog>
    );
  }

  renderStep1() {
    const { votedDelegate } = this.account;
    const { query } = this.state;
    const fee = this.injected.walletStore.fees.get('vote')!;

    const showSuggestions = !query || !query.trim();

    return (
      <VoteTransactionForm
        onSubmit={this.onSubmit1}
        onClose={this.onClose}
        onSearch={this.onSearch}
        query={this.state.query}
        isLoading={this.state.loadingDelegates}
        isSearch={!showSuggestions}
        delegates={this.state.displayedDelegates}
        votedDelegate={votedDelegate ? votedDelegate.publicKey : null}
        fee={fee}
        error={this.account.balance.lt(fee) ? 'insufficient-funds' : null}
      />
    );
  }

  renderStep2() {
    const { walletStore } = this.injected;
    let { selectedDelegate } = this.state;
    const { votedDelegate } = this.account;

    assert(selectedDelegate, 'Delegate required');
    selectedDelegate = selectedDelegate!;

    let removeVotes = [];
    let addVotes = [];

    const isRemoveTx =
      votedDelegate && votedDelegate.publicKey === selectedDelegate.publicKey;
    if (votedDelegate) {
      removeVotes.push(votedDelegate.username);
    }
    if (!isRemoveTx) {
      addVotes.push(selectedDelegate.username);
    }
    return (
      <ConfirmTransactionForm
        isPassphraseSet={this.account.secondSignature}
        sender={this.account.name}
        senderId={this.account.id}
        publicKey={this.account.publicKey}
        secondPublicKey={this.account.secondPublicKey}
        fee={walletStore.fees.get('vote')!}
        data={{
          kind: 'vote',
          remove: removeVotes,
          add: addVotes
        }}
        onSend={this.onSend}
        onRedo={this.onSend}
        onClose={this.onClose}
        progress={this.state.progress}
      />
    );
  }
}
