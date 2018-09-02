import * as assert from 'assert';
import { Delegate } from 'dpos-api-wrapper';
import { throttle, sampleSize } from 'lodash';
import { reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import ConfirmTransactionDialogContent from '../../components/content/ConfirmTransactionDialogContent';
import VoteDelegateDialogContent from '../../components/content/VoteDelegateDialogContent';
import { accountSettingsVoteRoute } from '../../routes';
import Dialog, { DialogProps } from '../../components/Dialog';
import AccountStore, { LoadingState } from '../../stores/account';
import WalletStore from '../../stores/wallet';

interface Props {
  account: AccountStore;
  onNavigateBack: () => void;
}

interface PropsInjected extends Props {
  routerStore: RouterStore;
  walletStore: WalletStore;
}

interface State {
  activeDelegates: null | Delegate[];
  step:
    | 'vote'
    | 'confirm'
    | 'sending'
    | 'failure'
    | 'sent';
  query: string;
  search: {
    isLoading: boolean;
    query: string;
    delegates: Delegate[];
  };
  selectedDelegate: null | Delegate;
  secrets: {
    mnemonic: string;
    passphrase: null | string;
  };
  sendError: string;
}

const EMPTY_SECRETS = {
  mnemonic: '',
  passphrase: null,
};

@inject('routerStore')
@inject('walletStore')
@observer
class VoteDelegateDialog extends React.Component<Props, State> {
  disposeOpenMonitor: null | IReactionDisposer = null;
  lastSearch = 0;
  state: State = {
    activeDelegates: null,
    step: 'vote',
    query: '',
    search: {
      isLoading: true,
      query: '',
      delegates: [],
    },
    selectedDelegate: null,
    secrets: EMPTY_SECRETS,
    sendError: '',
  };

  searchDelegates = throttle(async (query: string) => {
    const thisSearch = ++this.lastSearch;
    const { walletStore } = this.injected;
    query = query.trim();

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
  });

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  handleClose = () => {
    const { onNavigateBack } = this.injected;

    // Clear secrets from state when closing
    this.setState({
      secrets: EMPTY_SECRETS,
    });

    onNavigateBack();
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
    this.setState({
      step: 'confirm',
      selectedDelegate: delegate,
    });
  }

  handleBackFromConfirm = () => {
    this.setState({
      step: 'vote',
    });
  }

  handleConfirmTransaction = (secrets: State['secrets']) => {
    this.sendTransaction(secrets);
  }

  handleRetryTransaction = () => {
    const { secrets } = this.state;
    this.sendTransaction(secrets);
  }

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
      const response = await walletStore.dposAPI.delegates.getList();
      activeDelegates = response.delegates;
    }
    // Make sure that the suggestions are still something that the user is interested in
    if (this.lastSearch !== thisSearch) {
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

  async sendTransaction(secrets: State['secrets']) {
    const { account, walletStore } = this.injected;
    const { selectedDelegate } = this.state;

    assert(selectedDelegate, 'Delegate selection required');

    this.setState({ step: 'sending' });

    let success = false;
    let errorSummary = '';
    let canRetry = false;
    try {
      const tx = await walletStore.voteTransaction(
        selectedDelegate!.publicKey,
        secrets.mnemonic,
        secrets.passphrase,
        account.id
      );
      success = tx.success;
      // TODO error msg
      errorSummary = '';
      // If the node rejected the transaction there's no point in retrying
      canRetry = false;
    } catch (e) {
      success = false;
      // TODO: Network errors should be safe to retry. But we cannot do that because
      //       there's a failure case where it isn't safe currently - when the request
      //       goes through, but network is cut out mid-response. Sending the transaction
      //       again currently means we generate and sign a new transaction and that can
      //       potentially cause loss of funds. Retry will be safe if we resend the same
      //       data blob that we produced on first signing.
      canRetry = false;
      errorSummary = e.toString();
    }

    if (success) {
      this.setState({
        step: 'sent',
        secrets: EMPTY_SECRETS,
      });
    } else {
      // TODO: Really wish we would not store the secrets in memory for extended periods of time,
      //       instead the transaction should be prepared and then if retry is required just sent
      //       again.
      this.setState({
        step: 'failure',
        secrets: canRetry ? secrets : EMPTY_SECRETS,
        sendError: errorSummary,
      });
    }
  }

  resetState() {
    this.setState({
      query: '',
      step: 'vote',
      selectedDelegate: null,
      secrets: EMPTY_SECRETS,
      sendError: '',
    });
    this.suggestDelegates();

    // load the current vote (settings should preload)
    const { account, walletStore } = this.injected;
    if (account.votedDelegateState === LoadingState.NOT_LOADED) {
      walletStore.loadVotedDelegate(account.id);
    }
  }

  componentWillMount() {
    this.disposeOpenMonitor = reaction(() => this.isOpen, (isOpen) => {
      if (isOpen) {
        this.resetState();
      }
    });

    this.resetState();
  }

  componentWillUnmount() {
    if (this.disposeOpenMonitor) {
      this.disposeOpenMonitor();
      this.disposeOpenMonitor = null;
    }
  }

  get isOpen() {
    const { routerStore } = this.injected;
    return routerStore.currentView === accountSettingsVoteRoute;
  }

  get voteFee() {
    const { walletStore } = this.injected;
    return  walletStore.fees.get('vote')!;
  }

  render() {
    const { onClose, onNavigateBack, content } = this.renderStep();

    return (
      <Dialog
        open={this.isOpen}
        onClose={onClose}
        onNavigateBack={onNavigateBack}
        children={content}
      />
    );
  }

  renderStep(): {
    onClose?: DialogProps['onClose'],
    onNavigateBack?: DialogProps['onNavigateBack'],
    content: DialogProps['children'],
  } {
    const { step } = this.state;

    switch (step) {
      default:
        return {
          onClose: this.handleClose,
          content: this.renderVoteContent(),
        };
      case 'confirm':
        return {
          onClose: this.handleClose,
          onNavigateBack: this.handleBackFromConfirm,
          content: this.renderConfirmTxContent(),
        };
      case 'sending':
        return {
          content: this.renderSendingTxContent(),
        };
      case 'failure':
        return {
          onClose: this.handleClose,
          content: this.renderFailedTxContent(),
        };
      case 'sent':
        return {
          onClose: this.handleClose,
          content: this.renderSentTxContent(),
        };
    }
  }

  renderVoteContent() {
    const { account } = this.injected;
    const { votedDelegate, balance } = account;
    const { query, search } = this.state;

    const fee = this.voteFee;
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
          hasInsufficientFunds ? {
            kind: 'insufficient-funds',
            onClose: this.handleClose,
          }
          : showSuggestions ? {
            kind: 'suggestions',
            delegates: search.delegates,
          }
          : {
            kind: 'search-results',
            query: search.query,
            delegates: search.delegates,
          }
        }
      />
    );
  }

  confirmDialogData() {
    const { account } = this.injected;
    const { votedDelegate } = account;
    const { selectedDelegate } = this.state;

    let removeNames = [];
    let addNames = [];

    const isRemoveTx =
      votedDelegate && selectedDelegate && votedDelegate.publicKey === selectedDelegate.publicKey;
    if (votedDelegate) {
      removeNames.push(votedDelegate.username);
    }
    if (!isRemoveTx && selectedDelegate) {
      addNames.push(selectedDelegate.username);
    }
    return {
      kind: 'vote' as 'vote',
      remove: removeNames,
      add: addNames,
    };
  }

  renderConfirmTxContent() {
    const { account } = this.injected;

    return (
      <ConfirmTransactionDialogContent
        data={this.confirmDialogData()}
        fee={this.voteFee}
        senderName={account.name}
        senderAddress={account.id}
        step={{
          kind: 'confirm',
          publicKey: account.publicKey,
          secondPublicKey: account.secondPublicKey,
          onConfirm: this.handleConfirmTransaction
        }}
      />
    );
  }

  renderSendingTxContent() {
    const { account } = this.injected;

    return (
      <ConfirmTransactionDialogContent
        data={this.confirmDialogData()}
        fee={this.voteFee}
        senderName={account.name}
        senderAddress={account.id}
        step={{
          kind: 'in-progress'
        }}
      />
    );
  }

  renderFailedTxContent() {
    const { account } = this.injected;
    const { secrets, sendError } = this.state;

    const canRetry = !!secrets.mnemonic;

    return (
      <ConfirmTransactionDialogContent
        data={this.confirmDialogData()}
        fee={this.voteFee}
        senderName={account.name}
        senderAddress={account.id}
        step={{
          kind: 'failure',
          reason: sendError,
          onRetry: canRetry ? this.handleRetryTransaction : undefined,
          onClose: this.handleClose,
        }}
      />
    );
  }

  renderSentTxContent() {
    const { account } = this.injected;

    return (
      <ConfirmTransactionDialogContent
        data={this.confirmDialogData()}
        fee={this.voteFee}
        senderName={account.name}
        senderAddress={account.id}
        step={{
          kind: 'success',
          onClose: this.handleClose,
        }}
      />
    );
  }
}

export default VoteDelegateDialog;
