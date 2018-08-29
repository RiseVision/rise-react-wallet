import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Dialog from '../../components/Dialog';
import ConfirmTransactionForm, {
  ProgressState,
  State as ConfirmFormState
} from '../../components/forms/ConfirmTransactionForm';
import SendTransactionForm, {
  SendFormState
} from '../../components/forms/SendTransactionForm';
import { accountOverviewRoute } from '../../routes';
import { accountStore } from '../../stores';
import AccountStore from '../../stores/account';
import WalletStore, { TTransactionResult } from '../../stores/wallet';
import { RawAmount } from '../../utils/amounts';

interface Props {
  onSubmit?: (tx?: TTransactionResult) => void;
  amount?: RawAmount;
  recipientId?: string;
  account?: AccountStore;
  notModal?: boolean;
}

interface PropsInjected extends Props {
  accountStore: AccountStore;
  routerStore: RouterStore;
  walletStore: WalletStore;
}

export interface State {
  step: number;
  recipientID?: string;
  tx?: TTransactionResult;
  amount: RawAmount | null;
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
    amount: RawAmount.ZERO,
    step: 1,
    progress: ProgressState.TO_CONFIRM
  };

  get injected(): PropsInjected {
    // @ts-ignore
    return this.props;
  }

  get account() {
    return this.injected.account || this.injected.accountStore;
  }

  constructor(props: Props) {
    super(props);
    this.state.amount = props.amount || null;
    if (props.recipientId) {
      this.state.recipientID = props.recipientId;
    }
  }

  onSubmit1 = (state: SendFormState) => {
    if (!state.amount) {
      throw new Error('Amount required');
    }
    this.setState({
      step: 2,
      ...state
    });
  }

  onSend = async (state: ConfirmFormState) => {
    const { walletStore } = this.injected;
    // set in-progress
    this.setState({ progress: ProgressState.IN_PROGRESS });
    let tx: TTransactionResult;
    try {
      // TODO error msg
      tx = await walletStore.sendTransaction(
        this.state.recipientID!,
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
      this.injected.walletStore.refreshAccount(this.account.id);
    }
    if (this.injected.onSubmit) {
      this.injected.onSubmit(this.state.tx);
    } else {
      // fallback
      this.injected.routerStore.goTo(accountOverviewRoute, {
        id: this.account.id
      });
    }
  }

  onBackClick = () => {
    if (this.state.step === 2) {
      this.setState({ step: 1 });
    }
  }

  render() {
    let title;
    const step = this.state.step;
    const inProgress = this.state.progress === ProgressState.IN_PROGRESS;

    if (step === 1) {
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

    const content = step === 1 ? this.renderStep1() : this.renderStep2();
    if (this.props.notModal) {
      return content;
    }

    return (
      <Dialog
        title={title}
        open={true}
        onClose={(!inProgress && this.onClose) || undefined}
        onBackClick={(step === 2 && this.onBackClick) || undefined}
      >
        {content}
      </Dialog>
    );
  }

  renderStep1() {
    const { walletStore } = this.injected;
    // TODO validate the recipient
    return (
      <SendTransactionForm
        fee={walletStore.fees.get('send')!}
        balance={this.account.balance}
        onSubmit={this.onSubmit1}
        recipientID={this.state.recipientID || this.injected.recipientId}
        amount={this.state.amount || this.injected.amount || RawAmount.ZERO}
      />
    );
  }

  renderStep2() {
    const { walletStore } = this.injected;
    return (
      <ConfirmTransactionForm
        isPassphraseSet={this.account.secondSignature}
        sender={this.account.name}
        senderId={this.account.id}
        publicKey={this.account.publicKey}
        secondPublicKey={this.account.secondPublicKey}
        fee={walletStore.fees.get('send')!}
        data={{
          kind: 'send',
          recipientId: this.state.recipientID!,
          recipient: walletStore.idToName(this.state.recipientID!),
          amount: this.state.amount!
        }}
        onSend={this.onSend}
        onRedo={this.onSend}
        onClose={this.onClose}
        progress={this.state.progress}
      />
    );
  }
}
