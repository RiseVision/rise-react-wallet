import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import { accountOverviewRoute } from '../../routes';
import { accountStore } from '../../stores';
import AccountStore from '../../stores/account';
import WalletStore, { TTransactionResult } from '../../stores/wallet';
import SettingsPassphraseForm from '../../components/forms/SettingsPassphraseForm';
import ConfirmTransactionForm, {
  ProgressState,
  State as TransactionState
} from '../../components/forms/ConfirmTransactionForm';

interface Props {
  walletStore?: WalletStore;
  routerStore?: RouterStore;
  accountStore?: AccountStore;
  onSubmit?: (tx?: TTransactionResult) => void;
  account?: AccountStore;
}

export interface State {
  step: number;
  passphrase: string | null;
  tx?: TTransactionResult;
  // progress state
  progress: ProgressState;
  // states data
  error?: string;
}

// TODO extract the form container
// TODO props.wrapInDialog
@inject('walletStore')
@inject('routerStore')
@inject(accountStore)
@observer
class SettingsPassphrase extends React.Component<Props, State> {
  state: State = {
    step: 1,
    passphrase: null,
    progress: ProgressState.TO_CONFIRM
  };

  get account() {
    return this.props.account! || this.props.accountStore!;
  }

  onSubmit1 = (passphrase: string) => {
    const walletStore = this.props.walletStore!;
    const fee = walletStore.fees.get('secondsignature')!;
    const isSet = this.account.secondSignature;

    // cancel if already set or not enough balance
    if (isSet || this.account.balance < fee) {
      this.onClose();
    } else {
      this.setState({
        step: 2,
        passphrase,
      });
    }
  }

  onSend = async (state: TransactionState) => {
    // set in-progress
    this.setState({ progress: ProgressState.IN_PROGRESS });
    let tx: TTransactionResult;
    try {
      // TODO error msg
      tx = await this.props.walletStore!.addPassphrase(
        state.mnemonic,
        state.passphrase
      );
    } catch (e) {
      tx = { success: false };
    }
    const progress = tx.success ? ProgressState.SUCCESS : ProgressState.ERROR;
    this.setState({ tx, progress });
  }

  onClose = () => {
    if (this.props.onSubmit) {
      this.props.onSubmit(this.state.tx);
    } else {
      // fallback
      this.props.routerStore!.goTo(accountOverviewRoute);
    }
  }

  render() {
    return this.state.step === 1 ? this.renderStep1() : this.renderStep2();
  }

  renderStep1() {
    const { walletStore } = this.props;
    const fee = walletStore!.fees.get('secondsignature')!;
    const isSet = this.account.secondSignature;

    return (
      <SettingsPassphraseForm
        onSubmit={this.onSubmit1}
        fee={fee}
        error={
          isSet ? 'already-set'
          : this.account.balance < fee ? 'insufficient-funds'
          : null
        }
      />
    );
  }

  renderStep2() {
    const walletStore = this.props.walletStore!;
    return (
      <ConfirmTransactionForm
        onSend={this.onSend}
        onRedo={this.onSend}
        onClose={this.onClose}
        progress={this.state.progress}
        fee={walletStore.fees.get('secondsignature')!}
        data={{
          kind: 'passphrase',
        }}
        isPassphraseSet={this.account.secondSignature}
        sender={this.account.name}
        senderId={this.account.id}
      />
    );
  }
}

export default SettingsPassphrase;
