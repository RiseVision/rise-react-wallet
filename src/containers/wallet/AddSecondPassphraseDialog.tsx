import { Rise } from 'dpos-offline';
import { reaction, IReactionDisposer, runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import AddSecondPassphraseDialogContent from '../../components/content/AddSecondPassphraseDialogContent';
import {
  ICloseInterruptController,
  ICloseInterruptControllerState
} from '../../components/Dialog';
import { accountSettingsPassphraseRoute } from '../../routes';
import AccountStore, { AccountType } from '../../stores/account';
import LedgerStore from '../../stores/ledger';
import RootStore, { RouteLink } from '../../stores/root';
import WalletStore from '../../stores/wallet';
import ConfirmTransactionDialog from './ConfirmTransactionDialog';

interface Props {
  account: AccountStore;
  navigateBackLink: RouteLink;
  open?: boolean;
}

interface PropsInjected extends Props {
  store: RootStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
  ledgerStore: LedgerStore;
}

interface State extends ICloseInterruptControllerState {
  step: 'form' | 'transaction';
  transaction: null | {
    passphrase: string;
    publicKey: string;
  };
}

@inject('store')
@inject('routerStore')
@inject('walletStore')
@inject('ledgerStore')
@observer
class AddSecondPassphraseDialog extends React.Component<Props, State>
  implements ICloseInterruptController {
  disposeOpenMonitor: null | IReactionDisposer = null;
  state: State = {
    step: 'form',
    transaction: null
  };

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  get account(): AccountStore {
    return this.injected.account;
  }

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    // @ts-ignore
    const tagName = ev.currentTarget.tagName;
    const isButton =
      tagName && tagName.toLowerCase() === 'button' && ev.type === 'click';

    if (this.state.formChanged && !isButton) {
      return true;
    }

    const { navigateBackLink, store } = this.injected;
    store.navigateTo(navigateBackLink);
    return false;
  }

  handleNavigateBack = (ev: React.SyntheticEvent<{}>) => {
    this.setState({
      step: 'form',
      transaction: null
    });
  }

  handleAddPassphrase = (passphrase: string) => {
    // ledger requires to be open in a click handler
    if (this.account.type === AccountType.LEDGER) {
      this.injected.ledgerStore.open();
    }

    this.setState({
      step: 'transaction',
      transaction: {
        passphrase,
        publicKey: derivePublicKey(passphrase)
      }
    });
  }

  handleFormChanged = (changed: boolean) => {
    this.setState({ formChanged: changed });
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

  onSuccess = () => {
    const { transaction } = this.state;
    const { account } = this.injected;
    // set the passphrase locally
    const kp = Rise.deriveKeypair(transaction!.passphrase!);
    runInAction(() => {
      account.secondPublicKey = kp.publicKey.toString('hex');
      account.secondSignature = true;
    });
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
    const { routerStore, open } = this.injected;
    return open || routerStore.currentView === accountSettingsPassphraseRoute;
  }

  render() {
    const { account, navigateBackLink } = this.injected;
    const { step, transaction } = this.state;

    const canGoBack = step !== 'form';

    return (
      <ConfirmTransactionDialog
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
        onSuccess={this.onSuccess}
        onClose={this.handleClose}
        onCloseRoute={navigateBackLink}
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
        onFormChanged={this.handleFormChanged}
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
  return Rise.deriveKeypair(secret).publicKey.toString('hex');
}
