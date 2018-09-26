import { inject, observer } from 'mobx-react';
import { Route, RouteParams } from 'mobx-router';
import * as React from 'react';
import ConfirmTransactionDialogContent from '../../components/content/ConfirmTransactionDialogContent';
import Dialog from '../../components/Dialog';
import AccountStore from '../../stores/account';
import RootStore, { RouteLink } from '../../stores/root';
import WalletStore, {
  TFeeTypes,
  TTransactionResult
} from '../../stores/wallet';
import { RawAmount } from '../../utils/amounts';
import { PropsOf } from '../../utils/metaTypes';

export type Secrets = {
  mnemonic: string;
  passphrase: null | string;
};

const EMPTY_SECRETS: Secrets = {
  mnemonic: '',
  passphrase: null
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
  onSendTransaction: (secrets: Secrets) => Promise<TTransactionResult>;
}

interface PropsInjected extends Props {
  store: RootStore;
  walletStore: WalletStore;
}

interface State {
  transaction: Props['transaction'];
  step: 'confirm' | 'sending' | 'failure' | 'sent';
  secrets: Secrets;
  sendError: string;
}

@inject('store')
@inject('walletStore')
@observer
class TransactionDialog extends React.Component<Props, State> {
  state: State = {
    transaction: null,
    step: 'confirm',
    secrets: EMPTY_SECRETS,
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
        secrets: EMPTY_SECRETS,
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
    this.beforeClose();
    if (onClose) {
      onClose(ev);
    } else if (closeLink) {
      // Fallback to the closeLink as we use this event handler for the
      // dialog content close buttons as well
      store.navigateTo(closeLink);
    }
  }

  wrapCloseLink(link: RouteLink): RouteLink {
    return {
      ...link,
      onBeforeNavigate: (route: Route<{}>, params: RouteParams, queryParams: RouteParams) => {
        this.beforeClose();
        if (link.onBeforeNavigate) {
          link.onBeforeNavigate(route, params, queryParams);
        }
      },
    };
  }

  beforeClose() {
    // Clear secrets from state when closing
    this.setState({
      secrets: EMPTY_SECRETS
    });

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
      // this supports only a single transaction per request
      success = Boolean(tx.accepted && tx.accepted.length);
      if (!success) {
        // get the error
        errorSummary = tx.invalid![0].reason.slice(0, 30);
        canRetry = true;
      }
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
        secrets: EMPTY_SECRETS
      });
    } else {
      // TODO: Really wish we would not store the secrets in memory for extended periods of time,
      //       instead the transaction should be prepared and then if retry is required just sent
      //       again.
      this.setState({
        step: 'failure',
        secrets: canRetry ? secrets : EMPTY_SECRETS,
        sendError: errorSummary
      });
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
    const { onClose, closeLink, onNavigateBack, navigateBackLink } = this.injected;

    if (!transaction) {
      const { children } = this.injected;
      return { onClose, closeLink, onNavigateBack, navigateBackLink, children };
    }

    const closeProps: Pick<DialogProps, 'onClose' | 'closeLink'> = {};
    if (closeLink) {
      closeProps.closeLink = this.wrapCloseLink(closeLink);
    } else {
      closeProps.onClose = this.handleClose;
    }

    const backProps: Pick<DialogProps, 'onNavigateBack' | 'navigateBackLink'> = {};
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
