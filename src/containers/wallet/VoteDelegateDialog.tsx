import { Delegate } from 'dpos-api-wrapper';
import { throttle, sampleSize } from 'lodash';
import { reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import { normalizeAddress } from '../../utils/utils';
import TransactionDialog from './TransactionDialog';
import VoteDelegateDialogContent from '../../components/content/VoteDelegateDialogContent';
import { accountSettingsVoteRoute } from '../../routes';
import RootStore, { RouteLink } from '../../stores/root';
import AccountStore, { LoadingState } from '../../stores/account';
import WalletStore from '../../stores/wallet';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
}

interface PropsInjected extends Props {
  store: RootStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

interface State {
  activeDelegates: null | Delegate[];
  step: 'vote' | 'transaction';
  query: string;
  search: {
    isLoading: boolean;
    query: string;
    delegates: Delegate[];
  };
  transaction: null | {
    add: string[];
    remove: string[];
    delegate: Delegate;
  };
}

@inject('store')
@inject('routerStore')
@inject('walletStore')
@observer
class VoteDelegateDialog extends React.Component<Props, State> {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  get isOpen() {
    const { routerStore } = this.injected;
    return routerStore.currentView === accountSettingsVoteRoute;
  }

  disposeOpenMonitor: null | IReactionDisposer = null;
  lastSearch = 0;
  state: State = {
    activeDelegates: null,
    step: 'vote',
    query: '',
    search: {
      isLoading: true,
      query: '',
      delegates: []
    },
    transaction: null
  };

  searchDelegates = throttle(
    async (query: string) => {
      const thisSearch = ++this.lastSearch;
      const { walletStore } = this.injected;
      query = query.trim().toLowerCase();

      // search by address (local)
      if (this.searchByID(query)) {
        return;
      }

      // search by name (API)
      this.setState({
        search: {
          isLoading: true,
          query,
          delegates: []
        }
      });

      const result = await walletStore.searchDelegates(query);
      // Make sure that the results are still something that the user is interested in
      if (this.lastSearch !== thisSearch) {
        return;
      }

      this.setState({
        search: {
          isLoading: false,
          query,
          delegates: result.slice(0, 3)
        }
      });
    },
    500,
    { leading: false, trailing: true }
  );

  searchByID = (query: string) => {
    // search by address (local)
    const isID = normalizeAddress(query);
    if (!isID) {
      return false;
    }
    const { activeDelegates } = this.state;
    const match =
      activeDelegates &&
      activeDelegates.find(delegate => delegate.address === isID);

    this.setState({
      search: {
        isLoading: false,
        query,
        delegates: match ? [match] : []
      }
    });

    return true;
  }

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    const { store, navigateBackLink } = this.injected;
    store.navigateTo(navigateBackLink);
  }

  handleNavigateBack = (ev: React.SyntheticEvent<{}>) => {
    this.setState({
      step: 'vote',
      transaction: null
    });
  }

  handleQueryChange = (query: string) => {
    this.setState({ query });
    if (query.trim()) {
      this.searchDelegates(query);
    } else {
      this.suggestDelegates();
    }
  }

  handleSelectDelegate = (delegate: Delegate) => {
    const { account } = this.injected;
    const { votedDelegate } = account;

    let removeNames = [];
    let addNames = [];

    const isRemoveTx =
      votedDelegate && votedDelegate.publicKey === delegate.publicKey;
    if (votedDelegate) {
      removeNames.push(votedDelegate.username);
    }
    if (!isRemoveTx) {
      addNames.push(delegate.username);
    }

    this.setState({
      step: 'transaction',
      transaction: {
        add: addNames,
        remove: removeNames,
        delegate
      }
    });
  }

  // TODO not async
  async suggestDelegates() {
    const thisSearch = ++this.lastSearch;
    const { walletStore } = this.injected;

    let { activeDelegates } = this.state;
    if (activeDelegates === null) {
      this.setState({
        search: {
          isLoading: true,
          query: '',
          delegates: []
        }
      });
      // TODO keep queries in the store
      const response = await walletStore.dposAPI.delegates.getList();
      activeDelegates = response.delegates;
    }
    // Make sure that the suggestions are still something that the user is interested in
    if (this.lastSearch !== thisSearch) {
      // keep the delegates list anyway and redo a local search
      this.setState({
        activeDelegates: activeDelegates
      });
      this.searchByID(this.state.query);
      return;
    }

    this.setState({
      activeDelegates: activeDelegates,
      search: {
        isLoading: false,
        query: '',
        delegates: sampleSize(activeDelegates, 3)
      }
    });
  }

  handleCreateTransaction = () => {
    const { account, walletStore } = this.injected;
    const { step, transaction } = this.state;

    if (step === 'transaction' && transaction !== null) {
      return walletStore.createVoteTx(
        transaction.delegate.publicKey,
        account.id
      );
    } else {
      throw new Error('Invalid internal state');
    }
  }

  resetState() {
    this.setState({
      query: '',
      step: 'vote',
      transaction: null
    });
    this.suggestDelegates();

    // load the current vote (settings should preload)
    const { account, walletStore } = this.injected;
    if (account.votedDelegateState === LoadingState.NOT_LOADED) {
      walletStore.loadVotedDelegate(account.id);
    }
  }

  componentWillMount() {
    this.disposeOpenMonitor = reaction(
      () => this.isOpen,
      isOpen => {
        if (isOpen) {
          this.resetState();
        }
      }
    );

    this.resetState();
  }

  componentWillUnmount() {
    if (this.disposeOpenMonitor) {
      this.disposeOpenMonitor();
      this.disposeOpenMonitor = null;
    }
  }

  render() {
    const { account, navigateBackLink } = this.injected;
    const { step, transaction } = this.state;

    const canGoBack = step !== 'vote';

    return (
      <TransactionDialog
        open={this.isOpen}
        account={account}
        transaction={
          transaction
            ? {
                kind: 'vote',
                add: transaction.add,
                remove: transaction.remove
              }
            : null
        }
        onCreateTransaction={this.handleCreateTransaction}
        closeLink={navigateBackLink}
        onNavigateBack={canGoBack ? this.handleNavigateBack : undefined}
        children={this.renderVoteContent()}
      />
    );
  }

  renderVoteContent() {
    const { account, walletStore } = this.injected;
    const { votedDelegate, balance } = account;
    const { query, search } = this.state;

    const fee = walletStore.fees.get('vote')!;
    const hasInsufficientFunds = balance.lt(fee);

    const showSuggestions = search.query === '';

    return (
      <VoteDelegateDialogContent
        query={query}
        onQueryChange={this.handleQueryChange}
        onSelect={this.handleSelectDelegate}
        isLoading={search.isLoading}
        votedDelegate={votedDelegate}
        voteFee={fee}
        content={
          hasInsufficientFunds
            ? {
                kind: 'insufficient-funds',
                onClose: this.handleClose
              }
            : showSuggestions
              ? {
                  kind: 'suggestions',
                  delegates: search.delegates
                }
              : {
                  kind: 'search-results',
                  query: search.query,
                  delegates: search.delegates
                }
        }
      />
    );
  }
}

export default VoteDelegateDialog;
