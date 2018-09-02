import { reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import { LiskWallet } from 'dpos-offline';
import TransactionDialog, { Secrets } from './TransactionDialog';
import AddSecondPassphraseDialogContent from '../../components/content/AddSecondPassphraseDialogContent';
import { accountSettingsPassphraseRoute } from '../../routes';
import AccountStore from '../../stores/account';
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
  step:
    | 'passphrase'
    | 'transaction';
  transaction: null | {
    passphrase: string;
    publicKey: string;
  };
}

@inject('routerStore')
@inject('walletStore')
@observer
class AddSecondPassphraseDialog extends React.Component<Props, State> {
  disposeOpenMonitor: null | IReactionDisposer = null;
  state: State = {
    step: 'passphrase',
    transaction: null,
  };

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    const { onNavigateBack } = this.injected;
    onNavigateBack();
  }

  handleNavigateBack = (ev: React.SyntheticEvent<{}>) => {
    const { onNavigateBack } = this.injected;
    const { step } = this.state;

    if (step === 'passphrase') {
      onNavigateBack();
    } else {
      this.setState({
        step: 'passphrase',
        transaction: null,
      });
    }
  }

  handleAddPassphrase = (passphrase: string) => {
    this.setState({
      step: 'transaction',
      transaction: {
        passphrase: passphrase,
        publicKey: derivePublicKey(passphrase),
      },
    });
  }

  handleSendTransaction = (secrets: Secrets) => {
    const { account, walletStore } = this.injected;
    const { step, transaction } = this.state;

    if (step === 'transaction' && transaction !== null) {
      return walletStore.addPassphrase(
        secrets.mnemonic,
        secrets.passphrase!,
        account.id,
      );
    } else {
      throw new Error('Invalid internal state');
    }
  }

  resetState() {
    this.setState({
      step: 'passphrase',
      transaction: null,
    });
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
    return routerStore.currentView === accountSettingsPassphraseRoute;
  }

  render() {
    const { account } = this.injected;
    const { step, transaction } = this.state;

    const canGoBack = step !== 'passphrase';

    return (
      <TransactionDialog
        open={this.isOpen}
        account={account}
        transaction={transaction ? {
          kind: 'passphrase',
        } : null}
        passphrasePublicKey={transaction ? transaction.publicKey : ''}
        onSendTransaction={this.handleSendTransaction}
        onClose={this.handleClose}
        onNavigateBack={canGoBack ? this.handleNavigateBack : undefined}
        children={this.renderVoteContent()}
      />
    );
  }

  renderVoteContent() {
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
