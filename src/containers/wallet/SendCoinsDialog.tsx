import { reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import * as React from 'react';
import TransactionDialog, { Secrets } from './TransactionDialog';
import SendCoinsDialogContent from '../../components/content/SendCoinsDialogContent';
import { accountSendRoute } from '../../routes';
import AccountStore from '../../stores/account';
import WalletStore from '../../stores/wallet';
import { RawAmount } from '../../utils/amounts';

interface Props {
  account: AccountStore;
  amount?: RawAmount;
  recipient?: string;
  onNavigateBack: () => void;
}

interface PropsInjected extends Props {
  routerStore: RouterStore;
  walletStore: WalletStore;
}

interface State {
  amount: null | RawAmount;
  recipient: string;
  step:
    | 'form'
    | 'transaction';
  transaction: null | {
    recipient: string;
    amount: RawAmount;
  };
}

@inject('routerStore')
@inject('walletStore')
@observer
class SendCoinsDialog extends React.Component<Props, State> {
  disposeOpenMonitor: null | IReactionDisposer = null;
  state: State = {
    recipient: '',
    amount: null,
    step: 'form',
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

    if (step === 'form') {
      onNavigateBack();
    } else {
      this.setState({
        step: 'form',
        transaction: null,
      });
    }
  }

  handleSubmit = (data: { recipientID: string; amount: RawAmount }) => {
    const { recipientID: recipient, amount } = data;

    this.setState({
      recipient,
      amount,
      step: 'transaction',
      transaction: {
        recipient,
        amount,
      },
    });
  }

  handleSendTransaction = (secrets: Secrets) => {
    const { account, walletStore } = this.injected;
    const { step, transaction } = this.state;

    if (step === 'transaction' && transaction !== null) {
      return walletStore.sendTransaction(
        transaction.recipient,
        transaction.amount,
        secrets.mnemonic,
        secrets.passphrase!,
        account.id,
      );
    } else {
      throw new Error('Invalid internal state');
    }
  }

  resetState() {
    const { recipient, amount } = this.props;

    this.setState({
      recipient: recipient || '',
      amount: amount || null,
      step: 'form',
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
    return routerStore.currentView === accountSendRoute;
  }

  render() {
    const { account, walletStore } = this.injected;
    const { step, transaction } = this.state;

    const canGoBack = step !== 'form';

    return (
      <TransactionDialog
        open={this.isOpen}
        account={account}
        transaction={transaction ? {
          kind: 'send',
          recipientAddress: transaction.recipient,
          recipientName: walletStore.idToName(transaction.recipient),
          amount: transaction.amount,
        } : null}
        onSendTransaction={this.handleSendTransaction}
        onClose={this.handleClose}
        onNavigateBack={canGoBack ? this.handleNavigateBack : undefined}
        children={this.renderSendCoins()}
      />
    );
  }

  renderSendCoins() {
    const { account, walletStore } = this.injected;
    const { recipient, amount } = this.state;
    const fee = walletStore.fees.get('send')!;

    return (
      <SendCoinsDialogContent
        onSubmit={this.handleSubmit}
        recipientID={recipient}
        amount={amount}
        sendFee={fee}
        balance={account.balance}
      />
    );
  }
}

export default SendCoinsDialog;