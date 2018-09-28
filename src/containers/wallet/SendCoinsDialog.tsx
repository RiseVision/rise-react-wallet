import { reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import SendCoinsDialogContent from '../../components/content/SendCoinsDialogContent';
import { accountSendRoute } from '../../routes';
import AccountStore from '../../stores/account';
import AddressBookStore from '../../stores/addressBook';
import WalletStore, {
  TAddressRecord,
  TAddressSource
} from '../../stores/wallet';
import { RawAmount } from '../../utils/amounts';
import TransactionDialog from './TransactionDialog';

interface Props {
  account: AccountStore;
  amount?: RawAmount;
  recipientID?: string;
  onNavigateBack: () => void;
}

interface PropsInjected extends Props {
  routerStore: RouterStore;
  walletStore: WalletStore;
  addressBookStore: AddressBookStore;
}

interface State {
  amount: null | RawAmount;
  recipientID: string;
  step: 'form' | 'transaction';
  transaction: null | {
    recipientID: string;
    amount: RawAmount;
  };
}

@inject('routerStore')
@inject('walletStore')
@inject('addressBookStore')
@observer
class SendCoinsDialog extends React.Component<Props, State> {
  disposeOpenMonitor: null | IReactionDisposer = null;
  state: State = {
    recipientID: '',
    amount: null,
    step: 'form',
    transaction: null
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
        transaction: null
      });
    }
  }

  handleSubmit = (data: { recipientID: string; amount: RawAmount }) => {
    const { recipientID, amount } = data;

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
      throw new Error('Invalid internal state');
    }
  }

  resetState() {
    const { recipientID, amount } = this.props;

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
    const { account, walletStore, addressBookStore } = this.injected;
    const { recipientID, amount } = this.state;
    const fee = walletStore.fees.get('send')!;

    // TODO inject delegates into contacts, extract to a wallet method
    const addresses: TAddressRecord[] = addressBookStore.asArray.map(
      ({ id, name }) => ({
        id,
        name,
        source: TAddressSource.ADDRESS_BOOK
      })
    );
    const accounts: TAddressRecord[] = [...walletStore.accounts.values()]
      .filter(({ id }) => id !== account.id)
      .map(({ id, name }) => ({
        id,
        name: name || '',
        source: TAddressSource.WALLET
      }));

    const contacts = [...addresses, ...accounts];

    return (
      <SendCoinsDialogContent
        onSubmit={this.handleSubmit}
        recipientID={recipientID}
        amount={amount}
        sendFee={fee}
        balance={account.balance}
        contacts={contacts}
      />
    );
  }
}

export default SendCoinsDialog;
