import { reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import SendCoinsDialogContent
  from '../../components/content/SendCoinsDialogContent';
import {
  ICloseInterruptControllerState,
  ICloseInterruptController
} from '../../components/Dialog';
import { accountSendRoute } from '../../routes';
import AccountStore, { AccountType } from '../../stores/account';
import AddressBookStore from '../../stores/addressBook';
import LedgerStore from '../../stores/ledger';
import WalletStore from '../../stores/wallet';
import { RawAmount } from '../../utils/amounts';
import ConfirmTransactionDialog from './ConfirmTransactionDialog';

interface Props {
  account: AccountStore;
  amount?: RawAmount;
  recipientID?: string;
  onNavigateBack: () => void;
  open?: boolean;
}

interface PropsInjected extends Props {
  routerStore: RouterStore;
  walletStore: WalletStore;
  ledgerStore: LedgerStore;
  addressBookStore: AddressBookStore;
}

interface State extends ICloseInterruptControllerState {
  amount: null | RawAmount;
  recipientID: string;
  step: 'form' | 'transaction';
  transaction: null | {
    recipientID: string;
    amount: RawAmount;
  };
}

@inject('routerStore')
@inject('ledgerStore')
@inject('walletStore')
@inject('addressBookStore')
@observer
class SendCoinsDialog extends React.Component<Props, State>
  implements ICloseInterruptController {
  disposeOpenMonitor: null | IReactionDisposer = null;
  state: State = {
    recipientID: '',
    amount: null,
    step: 'form',
    transaction: null
  };

  get account(): AccountStore {
    return this.injected.account
  }

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    // @ts-ignore
    const tagName = ev.currentTarget.tagName;
    const isButton =
      tagName && tagName.toLowerCase() === 'button' && ev.type === 'click';

    if (this.state.formChanged && !isButton) {
      return true;
    }

    const { onNavigateBack } = this.injected;
    onNavigateBack();
    return false;
  }

  handleFormChanged = (changed: boolean) => {
    this.setState({ formChanged: changed });
  }

  handleNavigateBack = (ev: React.SyntheticEvent<{}>) => {
    const { onNavigateBack } = this.injected;
    const { step } = this.state;

    if (step === 'form') {
      onNavigateBack();
    } else {
      this.setState({
        step: 'form',
        transaction: null
      });
    }
  }

  handleSubmit = (data: { recipientID: string; amount: RawAmount }) => {
    const { recipientID, amount } = data;

    // ledger requires to be open in a click handler
    if (this.account.type === AccountType.LEDGER) {
      this.injected.ledgerStore.open()
    }

    debugger
    this.setState({
      recipientID,
      amount,
      step: 'transaction',
      transaction: {
        recipientID,
        amount
      }
    });
  }

  handleCreateTransaction = () => {
    const { account, walletStore } = this.injected;
    const { step, transaction } = this.state;

    if (step === 'transaction' && transaction !== null) {
      return walletStore.createSendTx(
        transaction.recipientID,
        transaction.amount,
        account.id
      );
    } else {
      debugger
      throw new Error('Invalid internal state');
    }
  }

  resetState() {
    const { recipientID, amount } = this.props;

    console.log('reset state')
    this.setState({
      recipientID: recipientID || '',
      amount: amount || null,
      step: 'form',
      transaction: null
    });
  }

  componentWillMount() {
    this.disposeOpenMonitor = reaction(
      () => this.isOpen,
      isOpen => {
        if (isOpen) {
          // TODO explain in a comment
          this.resetState();
        }
      }
    );

    // TODO explain in a comment
    this.resetState();

    const params = (this.injected.routerStore.queryParams || {}) as {
      address?: string;
      amount?: string;
    };
    if (params.address) {
      this.setState({ recipientID: params.address });
    }
    if (params.amount) {
      this.setState({
        amount: RawAmount.fromUnit(params.amount)
      });
    }
  }

  componentWillUnmount() {
    if (this.disposeOpenMonitor) {
      this.disposeOpenMonitor();
      this.disposeOpenMonitor = null;
    }
  }

  get isOpen() {
    const { routerStore, open } = this.injected;
    return open || routerStore.currentView === accountSendRoute;
  }

  render() {
    const { account, walletStore } = this.injected;
    const { step, transaction } = this.state;

    const canGoBack = step !== 'form';

    return (
      <ConfirmTransactionDialog
        open={this.isOpen}
        account={account}
        transaction={
          transaction
            ? {
                kind: 'send',
                recipientAddress: transaction.recipientID,
                recipientName: walletStore.idToName(transaction.recipientID),
                amount: transaction.amount
              }
            : null
        }
        onCreateTransaction={this.handleCreateTransaction}
        onClose={this.handleClose}
        onNavigateBack={canGoBack ? this.handleNavigateBack : undefined}
        children={this.renderSendCoins()}
      />
    );
  }

  renderSendCoins() {
    const { account, walletStore } = this.injected;
    const { recipientID, amount } = this.state;
    const fee = walletStore.fees.get('send')!;

    return (
      <SendCoinsDialogContent
        onFormChanged={this.handleFormChanged}
        onSubmit={this.handleSubmit}
        recipientID={recipientID}
        recipientName={walletStore.idToName(recipientID)}
        amount={amount}
        sendFee={fee}
        balance={account.balance}
        contacts={walletStore.getContacts()}
      />
    );
  }
}

export default SendCoinsDialog;
