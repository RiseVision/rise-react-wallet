import { BaseTx, ITransaction } from 'dpos-offline/dist/es5/trxTypes/BaseTx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import ConfirmTransactionDialogContent from '../../components/content/ConfirmTransactionDialogContent';
import Dialog from '../../components/Dialog';
import AccountStore from '../../stores/account';
import RootStore from '../../stores/root';
import WalletStore, { TFeeTypes } from '../../stores/wallet';
import { RawAmount } from '../../utils/amounts';
import { PropsOf } from '../../utils/metaTypes';

type Secrets = {
  mnemonic: string;
  passphrase: null | string;
};

type DialogProps = PropsOf<typeof Dialog>;
type ConfirmTransactionDialogContentProps = PropsOf<
  typeof ConfirmTransactionDialogContent
>;

type Transaction = ConfirmTransactionDialogContentProps['data'];

interface Props extends DialogProps {
  account: AccountStore;
  transaction: null | Transaction;
  passphrasePublicKey?: string;
  onCreateTransaction: () => Promise<BaseTx>;
}

interface PropsInjected extends Props {
  store: RootStore;
  walletStore: WalletStore;
}

interface State {
  transaction: Props['transaction'];
  step: 'confirm' | 'sending' | 'failure' | 'sent';
  signedTx: null | ITransaction;
  sendError: string;
}

@inject('store')
@inject('walletStore')
@observer
class TransactionDialog extends React.Component<Props, State> {
  state: State = {
    transaction: null,
    step: 'confirm',
    signedTx: null,
    sendError: ''
  };

  static getDerivedStateFromProps(
    nextProps: Readonly<Props>,
    prevState: State
  ): State {
    const hadTx = !!prevState.transaction;
    const hasTx = !!nextProps.transaction;

    if (!hadTx && hasTx) {
      // When transitioning into the tx flow, make sure that we start on a clean slate
      return {
        transaction: nextProps.transaction,
        step: 'confirm',
        signedTx: null,
        sendError: ''
      };
    } else {
      return {
        ...prevState,
        transaction: nextProps.transaction
      };
    }
  }

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    const { store, onClose, closeLink } = this.injected;
    if (onClose) {
      onClose(ev);
    } else if (closeLink) {
      // Fallback to the closeLink as we use this event handler for the
      // dialog content close buttons as well
      store.navigateTo(closeLink);
    }
  }

  handleBackFromConfirm = (ev: React.SyntheticEvent<{}>) => {
    const { onNavigateBack } = this.injected;
    if (onNavigateBack) {
      onNavigateBack(ev);
    }
  }

  handleConfirmTransaction = async (secrets: Secrets) => {
    const { walletStore, onCreateTransaction } = this.injected;

    this.setState({ step: 'sending' });

    const unsignedTx = await onCreateTransaction();
    const signedTx = walletStore.signTransaction(
      unsignedTx,
      secrets.mnemonic,
      secrets.passphrase || undefined
    );

    this.broadcastTransaction(signedTx);
  }

  handleRetryTransaction = () => {
    const { signedTx } = this.state;
    if (signedTx !== null) {
      this.broadcastTransaction(signedTx);
    }
  }

  async broadcastTransaction(signedTx: ITransaction) {
    const { walletStore } = this.injected;

    this.setState({ step: 'sending' });

    let success = false;
    let errorSummary = '';

    try {
      const result = await walletStore.broadcastTransaction(signedTx);
      // this supports only a single transaction per request
      success = Boolean(result.accepted && result.accepted.length);
      if (!success) {
        // get the error
        errorSummary = result.invalid![0].reason;
      }
    } catch (e) {
      success = false;
      // connection aborted after sending it
      if (e && e.code === 'ECONNABORTED') {
        // try to request the transaction
        // if successful, consider the whole dialog as error-less
        success = await this.checkTransactionExists(signedTx.id);
      } else {
        // all the other errors
        errorSummary = e.toString();
      }
    }

    if (success) {
      this.setState({
        step: 'sent',
        signedTx: null
      });
    } else {
      this.setState({
        step: 'failure',
        signedTx,
        sendError: errorSummary
      });
    }
  }

  async checkTransactionExists(id: string): Promise<boolean> {
    const { walletStore } = this.injected;

    try {
      // try to request the transaction
      const tx = await walletStore.dposAPI.transactions.get(id);
      return Boolean(tx.transaction);
    } catch (e) {
      return false;
    }
  }

  get fee(): RawAmount {
    const { walletStore } = this.injected;
    const { transaction } = this.state;

    if (!transaction) {
      return RawAmount.ZERO;
    }

    const feeMap: { [K in Transaction['kind']]: TFeeTypes } = {
      vote: 'vote',
      passphrase: 'secondsignature',
      delegate: 'delegate',
      send: 'send'
    };

    return walletStore.fees.get(feeMap[transaction.kind])!;
  }

  render() {
    const { open } = this.injected;

    return <Dialog open={open} {...this.dialogProps} />;
  }

  get dialogProps(): Pick<
    DialogProps,
    'onClose' | 'closeLink' | 'onNavigateBack' | 'navigateBackLink' | 'children'
  > {
    const { transaction, step } = this.state;
    const {
      onClose,
      closeLink,
      onNavigateBack,
      navigateBackLink
    } = this.injected;

    if (!transaction) {
      const { children } = this.injected;
      return { onClose, closeLink, onNavigateBack, navigateBackLink, children };
    }

    const closeProps: Pick<DialogProps, 'onClose' | 'closeLink'> = {};
    if (closeLink) {
      closeProps.closeLink = closeLink;
    } else {
      closeProps.onClose = this.handleClose;
    }

    const backProps: Pick<
      DialogProps,
      'onNavigateBack' | 'navigateBackLink'
    > = {};
    if (navigateBackLink) {
      backProps.navigateBackLink = navigateBackLink;
    } else {
      backProps.onNavigateBack = onNavigateBack;
    }

    switch (step) {
      default:
        return {
          ...closeProps,
          ...backProps,
          children: this.renderConfirmTxContent()
        };
      case 'sending':
        return {
          children: this.renderSendingTxContent()
        };
      case 'failure':
        return {
          ...closeProps,
          children: this.renderFailedTxContent()
        };
      case 'sent':
        return {
          ...closeProps,
          children: this.renderSentTxContent()
        };
    }
  }

  renderConfirmTxContent() {
    const { account, passphrasePublicKey } = this.injected;
    const { transaction } = this.state;

    return (
      <ConfirmTransactionDialogContent
        data={transaction!}
        fee={this.fee}
        senderName={account.name}
        senderAddress={account.id}
        step={{
          kind: 'confirm',
          publicKey: account.publicKey,
          secondPublicKey: passphrasePublicKey || account.secondPublicKey,
          onConfirm: this.handleConfirmTransaction
        }}
      />
    );
  }

  renderSendingTxContent() {
    const { account } = this.injected;
    const { transaction } = this.state;

    return (
      <ConfirmTransactionDialogContent
        data={transaction!}
        fee={this.fee}
        senderName={account.name}
        senderAddress={account.id}
        step={{
          kind: 'in-progress'
        }}
      />
    );
  }

  renderFailedTxContent() {
    const { account } = this.injected;
    const { transaction, signedTx, sendError } = this.state;

    const canRetry = !!signedTx;

    return (
      <ConfirmTransactionDialogContent
        data={transaction!}
        fee={this.fee}
        senderName={account.name}
        senderAddress={account.id}
        step={{
          kind: 'failure',
          reason: sendError,
          onRetry: canRetry ? this.handleRetryTransaction : undefined,
          onClose: this.handleClose
        }}
      />
    );
  }

  renderSentTxContent() {
    const { account } = this.injected;
    const { transaction } = this.state;

    return (
      <ConfirmTransactionDialogContent
        data={transaction!}
        fee={this.fee}
        senderName={account.name}
        senderAddress={account.id}
        step={{
          kind: 'success',
          onClose: this.handleClose
        }}
      />
    );
  }
}

export default TransactionDialog;
