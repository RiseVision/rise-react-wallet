import { inject, observer } from 'mobx-react';
import * as React from 'react';
import ConfirmTransactionDialogContent from '../../components/content/ConfirmTransactionDialogContent';
import Dialog from '../../components/Dialog';
import AccountStore from '../../stores/account';
import WalletStore, { TFeeTypes, TTransactionResult } from '../../stores/wallet';
import { RawAmount } from '../../utils/amounts';
import { PropsOf } from '../../utils/metaTypes';

export type Secrets = {
  mnemonic: string;
  passphrase: null | string;
};

const EMPTY_SECRETS: Secrets = {
  mnemonic: '',
  passphrase: null,
};

type DialogProps = PropsOf<typeof Dialog>;
type ConfirmTransactionDialogContentProps = PropsOf<typeof ConfirmTransactionDialogContent>;

type Transaction = ConfirmTransactionDialogContentProps['data'];

interface Props extends DialogProps {
  account: AccountStore;
  transaction: null | Transaction;
  passphrasePublicKey?: string;
  onSendTransaction: (secrets: Secrets) => Promise<TTransactionResult>;
}

interface PropsInjected extends Props {
  walletStore: WalletStore;
}

interface State {
  transaction: Props['transaction'];
  step:
    | 'confirm'
    | 'sending'
    | 'failure'
    | 'sent';
  secrets: Secrets;
  sendError: string;
}

@inject('walletStore')
@observer
class TransactionDialog extends React.Component<Props, State> {
  state: State = {
    transaction: null,
    step: 'confirm',
    secrets: EMPTY_SECRETS,
    sendError: '',
  };

  static getDerivedStateFromProps(nextProps: Readonly<Props>, prevState: State): State {
    const hadTx = !!prevState.transaction;
    const hasTx = !!nextProps.transaction;

    if (!hadTx && hasTx) {
      // When transitioning into the tx flow, make sure that we start on a clean slate
      return {
        transaction: nextProps.transaction,
        step: 'confirm',
        secrets: EMPTY_SECRETS,
        sendError: '',
      };
    } else {
      return {
        ...prevState,
        transaction: nextProps.transaction,
      };
    }
  }

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    const { onClose } = this.injected;

    // Clear secrets from state when closing
    this.setState({
      secrets: EMPTY_SECRETS,
    });

    if (onClose) {
      onClose(ev);
    }
  }

  handleBackFromConfirm = (ev: React.SyntheticEvent<{}>) => {
    const { onNavigateBack } = this.injected;
    if (onNavigateBack) {
      onNavigateBack(ev);
    }
  }

  handleConfirmTransaction = (secrets: Secrets) => {
    this.sendTransaction(secrets);
  }

  handleRetryTransaction = () => {
    const { secrets } = this.state;
    this.sendTransaction(secrets);
  }

  async sendTransaction(secrets: Secrets) {
    const { onSendTransaction } = this.props;

    this.setState({ step: 'sending' });

    let success = false;
    let errorSummary = '';
    let canRetry = false;
    try {
      const tx = await onSendTransaction(secrets);
      success = tx.success;
      // TODO error msg
      errorSummary = '';
      // If the node rejected the transaction there's no point in retrying
      canRetry = false;
    } catch (e) {
      success = false;
      // TODO: Network errors should be safe to retry. But we cannot do that because
      //       there's a failure case where it isn't safe currently - when the request
      //       goes through, but network is cut out mid-response. Sending the transaction
      //       again currently means we generate and sign a new transaction and that can
      //       potentially cause loss of funds. Retry will be safe if we resend the same
      //       data blob that we produced on first signing.
      canRetry = false;
      errorSummary = e.toString();
    }

    if (success) {
      this.setState({
        step: 'sent',
        secrets: EMPTY_SECRETS,
      });
    } else {
      // TODO: Really wish we would not store the secrets in memory for extended periods of time,
      //       instead the transaction should be prepared and then if retry is required just sent
      //       again.
      this.setState({
        step: 'failure',
        secrets: canRetry ? secrets : EMPTY_SECRETS,
        sendError: errorSummary,
      });
    }
  }

  get fee(): RawAmount {
    const { walletStore } = this.injected;
    const { transaction } = this.state;

    if (!transaction) {
      return RawAmount.ZERO;
    }

    const feeMap: {
      [K in Transaction['kind']]: TFeeTypes;
    } = {
      'vote': 'vote',
      'passphrase': 'secondsignature',
      'delegate': 'delegate',
      'send': 'send',
    };

    return walletStore.fees.get(feeMap[transaction.kind])!;
  }

  render() {
    const { open } = this.injected;

    return (
      <Dialog open={open} {...this.dialogProps} />
    );
  }

  get dialogProps(): Pick<DialogProps, 'onClose' | 'onNavigateBack' | 'children'> {
    const { transaction, step } = this.state;

    if (!transaction) {
      const { onClose, onNavigateBack, children } = this.injected;
      return { onClose, onNavigateBack, children };
    }

    switch (step) {
      default:
        return {
          onClose: this.handleClose,
          onNavigateBack: this.handleBackFromConfirm,
          children: this.renderConfirmTxContent(),
        };
      case 'sending':
        return {
          children: this.renderSendingTxContent(),
        };
      case 'failure':
        return {
          onClose: this.handleClose,
          children: this.renderFailedTxContent(),
        };
      case 'sent':
        return {
          onClose: this.handleClose,
          children: this.renderSentTxContent(),
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
    const { transaction, secrets, sendError } = this.state;

    const canRetry = !!secrets.mnemonic;

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
          onClose: this.handleClose,
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
          onClose: this.handleClose,
        }}
      />
    );
  }
}

export default TransactionDialog;
