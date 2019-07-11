import { throttle, sampleSize } from 'lodash';
import { reaction, IReactionDisposer, observe, Lambda } from 'mobx';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { Delegate } from 'risejs/dist/es5/types/beans';
import VoteDelegateDialogContent from '../../components/content/VoteDelegateDialogContent';
import {
  ICloseInterruptController,
  ICloseInterruptControllerState
} from '../../components/Dialog';
import { accountSettingsVoteRoute } from '../../routes';
import AccountStore, { LoadingState, AccountType } from '../../stores/account';
import LedgerStore from '../../stores/ledger';
import RouterStore, { RouteLink } from '../../stores/router';
import WalletStore from '../../stores/wallet';
import { normalizeAddress, FullDelegate } from '../../utils/utils';
import ConfirmTransactionDialog from './ConfirmTransactionDialog';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
  open?: boolean;
}

interface PropsInjected extends Props {
  routerStore: RouterStore;
  walletStore: WalletStore;
  ledgerStore: LedgerStore;
}

interface State extends ICloseInterruptControllerState {
  step: 'vote' | 'transaction';
  query: string;
  search: {
    isLoading: boolean;
    query: string;
    delegates: FullDelegate[];
  };
  transaction: null | {
    add: string[];
    remove: string[];
    delegate: Delegate;
  };
}

@inject('routerStore')
@inject('walletStore')
@inject('ledgerStore')
@observer
class VoteDelegateDialog extends React.Component<Props, State>
  implements ICloseInterruptController {
  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  get account(): AccountStore {
    return this.injected.account;
  }

  get isOpen() {
    const { routerStore, open } = this.injected;
    return open || routerStore.currentView === accountSettingsVoteRoute;
  }

  disposeOpenMonitor: null | IReactionDisposer = null;
  disposeSuggestionsObserver: Lambda | null;

  lastSearch = 0;
  state: State = {
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

      // search by address
      const isID = normalizeAddress(query);
      if (isID) {
        return this.searchByID(query);
      }

      // search by query
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

  searchByID = async (query: string) => {
    const thisSearch = ++this.lastSearch;
    const { walletStore } = this.injected;

    // search by query
    this.setState({
      search: {
        isLoading: true,
        query,
        delegates: []
      }
    });

    const match = await walletStore.fetchDelegateByID(query.toUpperCase());

    if (this.lastSearch !== thisSearch) {
      return;
    }

    this.setState({
      search: {
        isLoading: false,
        query,
        delegates: match ? [match] : []
      }
    });
  };

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    // @ts-ignore
    const tagName = ev.currentTarget.tagName;
    const isButton =
      tagName && tagName.toLowerCase() === 'button' && ev.type === 'click';

    if (this.state.formChanged && !isButton) {
      return true;
    }

    const { routerStore, navigateBackLink } = this.injected;
    routerStore.navigateTo(navigateBackLink);
    return false;
  };

  handleFormChanged = (changed: boolean) => {
    this.setState({ formChanged: changed });
  };

  handleNavigateBack = (ev: React.SyntheticEvent<{}>) => {
    this.setState({
      step: 'vote',
      transaction: null
    });
  };

  handleQueryChange = (query: string) => {
    this.setState({ query });
    if (query.trim()) {
      this.searchDelegates(query);
    } else {
      this.suggestDelegates();
    }
  };

  handleSelectDelegate = (delegate: Delegate) => {
    const { account } = this.injected;
    const { votedDelegate } = account;

    // ledger requires to be open in a click handler
    if (this.account.type === AccountType.LEDGER) {
      this.injected.ledgerStore.open();
    }

    let removeNames = [];
    let addNames = [];

    const isRemoveTx =
      votedDelegate && votedDelegate.forgingPK === delegate.forgingPK;
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
  };

  suggestDelegates() {
    const { walletStore } = this.injected;

    this.setState({
      search: {
        isLoading: false,
        query: '',
        delegates: sampleSize(walletStore.suggestedDelegates, 3)
      }
    });
  }

  handleCreateTransaction = () => {
    const { account, walletStore } = this.injected;
    const { step, transaction } = this.state;

    if (step === 'transaction' && transaction !== null) {
      return walletStore.createVoteTx(
        transaction.delegate.username,
        account.id
      );
    } else {
      throw new Error('Invalid internal state');
    }
  };

  resetState() {
    this.setState({
      query: '',
      step: 'vote',
      transaction: null
    });
    // pass async
    this.injected.walletStore.fetchSuggestedDelegates();
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
    this.disposeSuggestionsObserver = observe(
      this.injected.walletStore,
      'suggestedDelegates',
      () => {
        if (!this.state.search.query) {
          this.suggestDelegates();
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
    if (this.disposeSuggestionsObserver) {
      this.disposeSuggestionsObserver();
      this.disposeSuggestionsObserver = null;
    }
  }

  render() {
    const { account, navigateBackLink } = this.injected;
    const { step, transaction } = this.state;

    const canGoBack = step !== 'vote';

    return (
      <ConfirmTransactionDialog
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
        onCloseRoute={navigateBackLink}
        onClose={this.handleClose}
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
        onFormChanged={this.handleFormChanged}
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
