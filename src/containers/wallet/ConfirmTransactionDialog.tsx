import { observable, runInAction, reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import React from 'react';
import { Rise } from 'dpos-offline';
import ConfirmTransactionDialogContent from '../../components/content/ConfirmTransactionDialogContent';
import Dialog, {
  ICloseInterruptController,
  ICloseInterruptControllerState
} from '../../components/Dialog';
import ConfirmTxEnterSecretsFooter from '../../components/ConfirmTxEnterSecretsFooter';
import ConfirmTxStatusFooter from '../../components/ConfirmTxStatusFooter';
import AccountStore, { AccountType } from '../../stores/account';
import RootStore from '../../stores/root';
import LedgerStore from '../../stores/ledger';
import WalletStore, {
  PostableRiseTransaction,
  RiseTransaction,
  TFeeTypes
} from '../../stores/wallet';
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
  onCreateTransaction: () => Promise<RiseTransaction>;
  onSuccess?: () => void;
  onError?: () => void;
}

interface PropsInjected extends Props {
  store: RootStore;
  walletStore: WalletStore;
  ledgerStore: LedgerStore;
}

interface State extends ICloseInterruptControllerState {
  transaction: Props['transaction'];
  step: 'confirm' | 'sending' | 'failure' | 'sent';
  signedTx: null | PostableRiseTransaction;
  sendError: string;
}

@inject('store')
@inject('walletStore')
@inject('ledgerStore')
@observer
class ConfirmTransactionDialog extends React.Component<Props, State>
  implements ICloseInterruptController {
  state: State = {
    transaction: null,
    step: 'confirm',
    signedTx: null,
    sendError: ''
  };

  open: boolean = false;
  private lastLedgerSignId = 0;
  private disposeLedgerMonitor: null | IReactionDisposer = null;

  private countdownId: null | number = null;
  @observable private confirmationTimeout: null | Date = null;
  @observable private countdownSeconds: number = 0;

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

  goBack = () => {
    const { store, onNavigateBack, navigateBackLink } = this.injected;
    if (onNavigateBack) {
      onNavigateBack();
    } else if (navigateBackLink) {
      store.navigateTo(navigateBackLink);
    }
  }

  handleClose = (ev: React.SyntheticEvent<{}>) => {
    // close interrupt
    // @ts-ignore
    const tagName = ev.currentTarget.tagName;
    const isButton =
      tagName && tagName.toLowerCase() === 'button' && ev.type === 'click';

    if (this.state.formChanged && !isButton) {
      return true;
    }

    // mark the dialog as closed
    if (!this.open) {
      return false;
    }
    this.dialogWillClose();

    // navigation part
    const { store, onClose, onCloseRoute } = this.injected;
    if (onClose) {
      onClose(ev);
    } else if (onCloseRoute) {
      // Fallback to the closeLink as we use this event handler for the
      // dialog content close buttons as well
      store.navigateTo(onCloseRoute);
    }
    return false;
  }

  handleFormChanged = (changed: boolean) => {
    this.setState({ formChanged: changed });
  }

  handleConfirmTransaction = async (secrets: Secrets) => {
    const { account, walletStore, onCreateTransaction } = this.injected;

    this.setState({ step: 'sending' });

    // Ensure that the account publicKey is set
    if (!account.publicKey) {
      const kp = Rise.deriveKeypair(secrets.mnemonic);
      runInAction(() => {
        account.publicKey = kp.publicKey.toString('hex');
      });
    }

    const unsignedTx = await onCreateTransaction();
    const signedTx = walletStore.signTransaction(
      unsignedTx,
      secrets.mnemonic,
      account.secondPublicKey ? secrets.passphrase : null
    );

    this.broadcastTransaction(signedTx);
  }

  handleRetryTransaction = () => {
    const { signedTx } = this.state;
    if (signedTx !== null) {
      this.broadcastTransaction(signedTx);
    }
  }

  async broadcastTransaction(signedTx: PostableRiseTransaction) {
    const { walletStore, onSuccess, onError } = this.injected;

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
      if (onSuccess) {
        onSuccess();
      }
    } else {
      this.setState({
        step: 'failure',
        signedTx,
        sendError: errorSummary
      });
      if (onError) {
        onError();
      }
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

  dialogWillOpen() {
    if (this.open) {
      return;
    }
    this.open = true;
    const { account } = this.injected;

    if (account.type === AccountType.LEDGER) {
      // TODO change reaction to a state change listener
      this.disposeLedgerMonitor = reaction(
        this.canSignOnLedger,
        this.beginLedgerSigning
      );
    }
  }

  dialogWillClose() {
    if (!this.open) {
      return;
    }
    this.open = false;
    // close the ledger
    this.injected.ledgerStore.close();

    if (this.disposeLedgerMonitor !== null) {
      this.disposeLedgerMonitor();
      this.disposeLedgerMonitor = null;
    }
  }

  componentWillUnmount() {
    this.dialogWillClose();
  }

  canSignOnLedger = () => {
    const { transaction, ledgerStore } = this.injected;
    const { step } = this.state;

    return (
      step === 'confirm' &&
      transaction !== null &&
      ledgerStore.hasSupport &&
      ledgerStore.isOpen
    );
  }

  beginLedgerSigning = async () => {
    const { account, onCreateTransaction, ledgerStore } = this.injected;

    const ledgerSignId = ++this.lastLedgerSignId;

    if (
      !ledgerStore.isOpen ||
      !this.canSignOnLedger() ||
      // !this.canSignOnLedger() ||
      account.hwSlot === null
    ) {
      return;
    }
    const accountSlot = account.hwSlot || 0;

    // Ensure that the account publicKey is set before calling onCreateTransaction
    if (!account.publicKey) {
      const info = await ledgerStore.getAccount(accountSlot);
      runInAction(() => {
        account.publicKey = info.publicKey;
      });
    }

    let unsignedTx = await onCreateTransaction();
    if (ledgerSignId !== this.lastLedgerSignId) {
      return;
    }

    this.confirmationTimeout = new Date(
      new Date().getTime() + ledgerStore.confirmationTimeout
    );
    this.updateConfirmationCountdown();

    let signedTx;
    try {
      signedTx = await ledgerStore.signTransaction(accountSlot, unsignedTx);
      if (ledgerSignId !== this.lastLedgerSignId) {
        return;
      }
    } catch (ex) {
      signedTx = null;
    }

    if (signedTx) {
      this.broadcastTransaction(signedTx);
    } else {
      this.goBack();
    }
  }

  render() {
    const { open } = this.injected;

    if (open) {
      this.dialogWillOpen();
    } else {
      this.dialogWillClose();
    }

    return <Dialog open={open} {...this.dialogProps} />;
  }

  // TODO simplify, describe
  get dialogProps(): Pick<
    DialogProps,
    | 'onClose'
    | 'onCloseRoute'
    | 'onNavigateBack'
    | 'navigateBackLink'
    | 'children'
  > {
    const { transaction, step } = this.state;
    const {
      onClose,
      onCloseRoute,
      onNavigateBack,
      navigateBackLink
    } = this.injected;

    // TODO comment needed
    if (!transaction) {
      const { children } = this.injected;
      return {
        onClose,
        onCloseRoute,
        onNavigateBack,
        navigateBackLink,
        children
      };
    }

    const closeProps: Pick<DialogProps, 'onClose' | 'onCloseRoute'> = {};
    closeProps.onClose = this.handleClose;

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
    const { account, passphrasePublicKey, ledgerStore } = this.injected;
    const { transaction } = this.state;

    return (
      <ConfirmTransactionDialogContent
        onFormChanged={this.handleFormChanged}
        data={transaction!}
        fee={this.fee}
        senderName={account.name}
        senderLocalId={account.localId}
        senderAddress={account.id}
      >
        {account.type === AccountType.LEDGER ? (
          !ledgerStore.hasSupport ? (
            <ConfirmTxStatusFooter type="ledger-not-supported" />
          ) : !ledgerStore.isOpen ? (
            <ConfirmTxStatusFooter type="ledger-not-connected" />
          ) : (
            <ConfirmTxStatusFooter
              type="ledger-confirming"
              timeout={this.countdownSeconds}
            />
          )
        ) : (
          <ConfirmTxEnterSecretsFooter
            address={account.id}
            publicKey={account.publicKey}
            secondPublicKey={passphrasePublicKey || account.secondPublicKey}
            onConfirm={this.handleConfirmTransaction}
          />
        )}
      </ConfirmTransactionDialogContent>
    );
  }

  renderSendingTxContent() {
    const { account } = this.injected;
    const { transaction } = this.state;

    return (
      <ConfirmTransactionDialogContent
        onFormChanged={this.handleFormChanged}
        data={transaction!}
        fee={this.fee}
        senderName={account.name}
        senderLocalId={account.localId}
        senderAddress={account.id}
      >
        <ConfirmTxStatusFooter type="broadcasting" />
      </ConfirmTransactionDialogContent>
    );
  }

  renderFailedTxContent() {
    const { account } = this.injected;
    const { transaction, signedTx, sendError } = this.state;

    const canRetry = !!signedTx;

    return (
      <ConfirmTransactionDialogContent
        onFormChanged={this.handleFormChanged}
        data={transaction!}
        fee={this.fee}
        senderName={account.name}
        senderLocalId={account.localId}
        senderAddress={account.id}
      >
        <ConfirmTxStatusFooter
          type="broadcast-failed"
          reason={sendError}
          onRetry={canRetry ? this.handleRetryTransaction : undefined}
          onClose={this.handleClose}
        />
      </ConfirmTransactionDialogContent>
    );
  }

  renderSentTxContent() {
    const { account } = this.injected;
    const { transaction } = this.state;

    return (
      <ConfirmTransactionDialogContent
        onFormChanged={this.handleFormChanged}
        data={transaction!}
        fee={this.fee}
        senderName={account.name}
        senderLocalId={account.localId}
        senderAddress={account.id}
      >
        <ConfirmTxStatusFooter
          type="broadcast-succeeded"
          onClose={this.handleClose}
        />
      </ConfirmTransactionDialogContent>
    );
  }

  private updateConfirmationCountdown = () => {
    const now = new Date();
    const remainMs =
      this.confirmationTimeout !== null
        ? this.confirmationTimeout.getTime() - now.getTime()
        : 0;
    const isCountdownActive = remainMs > 0;

    runInAction(() => {
      if (isCountdownActive) {
        this.countdownSeconds = Math.ceil(remainMs / 1000);
      } else {
        // Make sure that the timeout clears the selected account
        this.lastLedgerSignId += 1;
      }
    });

    if (isCountdownActive && this.countdownId === null) {
      this.countdownId = window.setInterval(
        this.updateConfirmationCountdown,
        250
      );
    } else if (!isCountdownActive && this.countdownId !== null) {
      window.clearInterval(this.countdownId);
      this.countdownId = null;
    }
  }
}

export default ConfirmTransactionDialog;
