import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Dialog from '../../components/Dialog';
import ConfirmTransactionForm, {
  ProgressState,
  State as ConfirmFormState
} from '../../components/forms/ConfirmTransactionForm';
import SendTransactionForm, { State as SendFormState } from '../../components/forms/SendTransactionForm';
import { accountOverviewRoute } from '../../routes';
import { accountStore } from '../../stores';
import AccountStore from '../../stores/account';
import WalletStore, { TTransactionResult } from '../../stores/wallet';
import { amountToServer, normalizeAddress } from '../../utils/utils';

interface Props {
  routerStore?: RouterStore;
  accountStore?: AccountStore;
  walletStore?: WalletStore;
  onSubmit?: (tx?: TTransactionResult) => void;
  amount?: number;
  recipientId?: string;
  account?: AccountStore;
  // TODO switch to get a dialog the form wrapped in a dialog
  // wrapInDialog?: boolean
}

export interface State {
  step: number;
  recipientId?: string;
  tx?: TTransactionResult;
  amount: number | null;
  // progress state
  progress: ProgressState;
  // states data
  error?: string;
}

@inject('routerStore')
@inject(accountStore)
@inject('walletStore')
@observer
export default class SendTransaction extends React.Component<Props, State> {
  state: State = {
    amount: 0,
    step: 1,
    progress: ProgressState.TO_CONFIRM
  };

  get account() {
    return this.props.account! || this.props.accountStore!;
  }

  constructor(props: Props) {
    super(props);
    this.state.amount = props.amount || null;
    if (props.recipientId) {
      this.state.recipientId = props.recipientId;
    }
  }

  onSubmit1 = (state: SendFormState) => {
    if (!state.amount) {
      throw new Error('Amount required');
    }
    // TODO validate amount is a number
    // TODO validate state.recipientId
    this.setState({
      recipientId: normalizeAddress(state.recipientId!),
      amount: amountToServer(state.amount),
      step: 2
    });
  }

  onSend = async (state: ConfirmFormState) => {
    const { walletStore } = this.props;
    // set in-progress
    this.setState({ progress: ProgressState.IN_PROGRESS });
    let tx: TTransactionResult;
    try {
      // TODO error msg
      tx = await walletStore!.sendTransaction(
        this.state.recipientId!,
        this.state.amount!,
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

  onClose = async () => {
    // refresh the account after a successful transaction
    if (this.state.tx) {
      this.props.walletStore!.refreshAccount(this.account.id);
    }
    if (this.props.onSubmit) {
      this.props.onSubmit(this.state.tx);
    } else {
      // fallback
      this.props.routerStore!.goTo(accountOverviewRoute);
    }
  }

  render() {
    let title;
    if (this.state.step === 1) {
      title = (
        <FormattedMessage
          id="settings-dialog-title"
          defaultMessage={'Send RISE'}
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
    const content =
      this.state.step === 1 ? this.renderStep1() : this.renderStep2();

    // TODO honor the props.wrapInDialog switch
    return (
      <Dialog title={title} open={true} onClose={this.onClose}>
        {content}
      </Dialog>
    );
  }

  renderStep1() {
    const { walletStore } = this.props;
    // TODO validate the recipient
    return (
      <SendTransactionForm
        amount={this.props.amount || 0}
        fee={walletStore!.fees.get('send')!}
        balance={this.account.balance}
        onSubmit={this.onSubmit1}
        recipientId={this.props.recipientId}
      />
    );
  }

  renderStep2() {
    const { walletStore } = this.props;
    return (
      <ConfirmTransactionForm
        isPassphraseSet={this.account.secondSignature}
        sender={this.account.name}
        senderId={this.account.id}
        fee={walletStore!.fees.get('send')!}
        data={{
          kind: 'send',
          recipientId: this.state.recipientId!,
          recipient: walletStore!.idToName(this.state.recipientId!),
          amount: this.state.amount!,
        }}
        onSend={this.onSend}
        onRedo={this.onSend}
        onClose={this.onClose}
        progress={this.state.progress}
      />
    );
  }
}
