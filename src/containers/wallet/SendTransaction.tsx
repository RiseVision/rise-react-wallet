import { inject, observer } from 'mobx-react';
import * as React from 'react';
import ConfirmTransactionForm, {
  State as ConfirmFormState
} from '../../components/forms/ConfirmTransactionForm';
import { accountOverviewRoute } from '../../routes';
import Store from '../../stores/store';
import UserStore, { TAccount } from '../../stores/user';
import SendTransactionForm, {
  State as SendFormState
} from '../../components/forms/SendTransactionForm';
import { amountToServer } from '../../utils/utils';
import SettingsDialog from './SettingsDialog';

interface Props {
  store?: Store;
  userStore?: UserStore;
  onSubmit?: (txId: string) => void;
  amount?: number;
  recipientId?: string;
  account?: TAccount;
}

export interface State {
  step: number;
  recipientId: string | null;
  txId?: number;
  amount: number | null;
}

@inject('store')
@inject('userStore')
@observer
// TODO should have a URL and also overlay when needed
export default class SendTransaction extends React.Component<Props, State> {
  state: State = {
    amount: 0,
    recipientId: null,
    step: 1
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
    this.setState({
      recipientId: state.recipientId,
      amount: amountToServer(state.amount),
      step: 2
    });
  }

  onSubmit2 = async (state: ConfirmFormState) => {
    // TODO loading state
    // TODO validation
    let txId = await this.props.userStore!.sendTransaction(
      this.state.recipientId!,
      this.state.amount!,
      state.mnemonic,
      state.passphrase,
      this.props.account
    );
    if (this.props.onSubmit) {
      this.props.onSubmit(txId);
    } else {
      // TODO show the TransactionSend dialog
      this.setState({ step: this.state.step + 1 });
      // TODO tmp
      this.props.store!.router.goTo(accountOverviewRoute);
    }
  }

  onDialogClose = () => {
    this.props.store!.router.goTo(accountOverviewRoute);
  }

  render() {
    const title = this.state.step === 1 ? 'Send RISE' : 'Confirm transaction';
    const content =
      this.state.step === 1 ? this.renderStep1() : this.renderStep2();

    return (
      <SettingsDialog title={title} open={true} onClose={this.onDialogClose}>
        {content}
      </SettingsDialog>
    );
  }

  renderStep1() {
    const userStore = this.props.userStore!;
    const balance =
      (this.props.account! && this.props.account!.balance) ||
      (userStore.selectedAccount! && userStore.selectedAccount!.balance) ||
      0;
    // TODO validate the recipient
    return (
      <SendTransactionForm
        amount={this.props.amount || 0}
        fee={userStore.fees.get('send')!}
        balance={balance}
        onSubmit={this.onSubmit1}
        recipientId={this.props.recipientId}
      />
    );
  }

  renderStep2() {
    const userStore = this.props.userStore!;
    const account = this.props.account! || userStore.selectedAccount!;
    return (
      <ConfirmTransactionForm
        isPassphraseSet={account.secondSignature}
        sender={account.name}
        senderId={account.id}
        recipientId={this.state.recipientId!}
        recipient={userStore.idToName(this.state.recipientId!)}
        amount={this.state.amount!}
        fee={userStore.fees.get('send')!}
        onSubmit={this.onSubmit2}
      />
    );
  }
}
