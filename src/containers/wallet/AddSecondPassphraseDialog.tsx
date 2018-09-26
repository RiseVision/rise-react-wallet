import { reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import { LiskWallet } from 'dpos-offline';
import TransactionDialog from './TransactionDialog';
import AddSecondPassphraseDialogContent from '../../components/content/AddSecondPassphraseDialogContent';
import { accountSettingsPassphraseRoute } from '../../routes';
import RootStore, { RouteLink } from '../../stores/root';
import AccountStore from '../../stores/account';
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
  step: 'form' | 'transaction';
  transaction: null | {
    passphrase: string;
    publicKey: string;
  };
}

@inject('store')
@inject('routerStore')
@inject('walletStore')
@observer
class AddSecondPassphraseDialog extends React.Component<Props, State> {
  disposeOpenMonitor: null | IReactionDisposer = null;
  state: State = {
    step: 'form',
    transaction: null
  };

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    const { navigateBackLink, store } = this.injected;
    store.navigateTo(navigateBackLink);
  }

  handleNavigateBack = (ev: React.SyntheticEvent<{}>) => {
    this.setState({
      step: 'form',
      transaction: null,
    });
  }

  handleAddPassphrase = (passphrase: string) => {
    this.setState({
      step: 'transaction',
      transaction: {
        passphrase,
        publicKey: derivePublicKey(passphrase)
      }
    });
  }

  createTransaction = () => {
    const { account, walletStore } = this.injected;
    const { step, transaction } = this.state;

    if (step === 'transaction') {
      return walletStore.createPassphraseTx(
        transaction!.passphrase!,
        account.id
      );
    } else {
      throw new Error('Invalid internal state');
    }
  }

  resetState() {
    this.setState({
      step: 'form',
      transaction: null
    });
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

  get isOpen() {
    const { routerStore } = this.injected;
    return routerStore.currentView === accountSettingsPassphraseRoute;
  }

  render() {
    const { account, navigateBackLink } = this.injected;
    const { step, transaction } = this.state;

    const canGoBack = step !== 'form';

    return (
      <TransactionDialog
        open={this.isOpen}
        account={account}
        transaction={
          transaction
            ? {
                kind: 'passphrase'
              }
            : null
        }
        passphrasePublicKey={transaction ? transaction.publicKey : ''}
        onCreateTransaction={this.createTransaction}
        closeLink={navigateBackLink}
        onNavigateBack={canGoBack ? this.handleNavigateBack : undefined}
        children={this.renderPassphraseContent()}
      />
    );
  }

  renderPassphraseContent() {
    const { account, walletStore } = this.injected;
    const fee = walletStore.fees.get('secondsignature')!;
    const isSet = account.secondSignature;

    return (
      <AddSecondPassphraseDialogContent
        onSubmit={this.handleAddPassphrase}
        onClose={this.handleClose}
        passphraseFee={fee}
        error={
          isSet
            ? 'already-set'
            : account.balance.lt(fee)
              ? 'insufficient-funds'
              : null
        }
      />
    );
  }
}

export default AddSecondPassphraseDialog;

function derivePublicKey(secret: string): string {
  const w = new LiskWallet(secret, 'R');
  return w.publicKey;
}
