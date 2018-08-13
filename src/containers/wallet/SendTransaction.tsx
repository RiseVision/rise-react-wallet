import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import ConfirmTransactionForm, {
  ProgressState,
  State as ConfirmFormState
} from '../../components/forms/ConfirmTransactionForm';
import { accountOverviewRoute } from '../../routes';
import RootStore from '../../stores/root';
import WalletStore, { TAccount, TTransactionResult } from '../../stores/wallet';
import SendTransactionForm, {
  State as SendFormState
} from '../../components/forms/SendTransactionForm';
import { amountToServer } from '../../utils/utils';
import Dialog from '../../components/Dialog';

interface Props {
  store?: RootStore;
  walletStore?: WalletStore;
  onSubmit?: (tx?: TTransactionResult) => void;
  amount?: number;
  recipientId?: string;
  account?: TAccount;
  // TODO switch to get a dialog the form wrapped in a dialog
  // wrapInDialog?: boolean
}

export interface State {
  step: number;
  recipientId: string | null;
  tx?: TTransactionResult;
  amount: number | null;
  // progress state
  progress: ProgressState;
  // states data
  error?: string;
}

@inject('store')
@inject('walletStore')
@observer
export default class SendTransaction extends React.Component<Props, State> {
  state: State = {
    amount: 0,
    recipientId: null,
    step: 1,
    progress: ProgressState.TO_CONFIRM
  };

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
    this.setState({
      recipientId: state.recipientId,
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
    const balance =
      (this.props.account! && this.props.account!.balance) ||
      (walletStore!.selectedAccount! &&
        walletStore!.selectedAccount!.balance) ||
      0;
    // TODO validate the recipient
    return (
      <SendTransactionForm
        amount={this.props.amount || 0}
        fee={walletStore!.fees.get('send')!}
        balance={balance}
        onSubmit={this.onSubmit1}
        recipientId={this.props.recipientId}
      />
    );
  }

  renderStep2() {
    const { walletStore } = this.props;
    const account = this.props.account! || walletStore!.selectedAccount!;
    return (
      <ConfirmTransactionForm
        isPassphraseSet={account.secondSignature}
        sender={account.name}
        senderId={account.id}
        recipientId={this.state.recipientId!}
        recipient={walletStore!.idToName(this.state.recipientId!)}
        amount={this.state.amount!}
        fee={walletStore!.fees.get('send')!}
        onSend={this.onSend}
        onRedo={this.onSend}
        onClose={this.onClose}
        progress={this.state.progress}
      />
    );
  }
}
