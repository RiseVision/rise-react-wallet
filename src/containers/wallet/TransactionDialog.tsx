import { BaseTx, ITransaction } from 'dpos-offline/dist/es5/trxTypes/BaseTx';
import { observable, runInAction, reaction, IReactionDisposer } from 'mobx';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import ConfirmTransactionDialogContent from '../../components/content/ConfirmTransactionDialogContent';
import Dialog from '../../components/Dialog';
import ConfirmTxEnterSecretsFooter from '../../components/ConfirmTxEnterSecretsFooter';
import ConfirmTxStatusFooter from '../../components/ConfirmTxStatusFooter';
import AccountStore, { AccountType } from '../../stores/account';
import RootStore from '../../stores/root';
import LedgerStore, { LedgerChannel } from '../../stores/ledger';
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
  ledgerStore: LedgerStore;
}

interface State {
  transaction: Props['transaction'];
  step: 'confirm' | 'sending' | 'failure' | 'sent';
  signedTx: null | ITransaction;
  sendError: string;
}

@inject('store')
@inject('walletStore')
@inject('ledgerStore')
@observer
class TransactionDialog extends React.Component<Props, State> {
  state: State = {
    transaction: null,
    step: 'confirm',
    signedTx: null,
    sendError: ''
  };

  private ledger: LedgerChannel;
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
    const { store, onClose, closeLink } = this.injected;
    if (onClose) {
      onClose(ev);
    } else if (closeLink) {
      // Fallback to the closeLink as we use this event handler for the
      // dialog content close buttons as well
      store.navigateTo(closeLink);
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

  componentDidMount() {
    const { ledgerStore } = this.injected;
    this.ledger = ledgerStore.openChannel();

    this.disposeLedgerMonitor = reaction(
      this.canSignOnLedger,
      this.beginLedgerSigning
    );
  }

  componentWillUnmount() {
    if (this.disposeLedgerMonitor !== null) {
      this.disposeLedgerMonitor();
      this.disposeLedgerMonitor = null;
    }

    this.ledger.close();
  }

  canSignOnLedger = () => {
    const { transaction, account, ledgerStore } = this.injected;
    const { step } = this.state;
    const { ledger } = this;

    return step === 'confirm'
      && transaction !== null
      && ledgerStore.hasBrowserSupport
      && account.hwId !== null
      && ledger.deviceId === account.hwId;
  }

  beginLedgerSigning = async () => {
    const { account, onCreateTransaction } = this.injected;
    const { ledger } = this;

    const ledgerSignId = ++this.lastLedgerSignId;

    if (!this.canSignOnLedger() || account.hwSlot === null) {
      return;
    }
    const accountSlot = account.hwSlot || 0;

    let unsignedTx = await onCreateTransaction();
    if (ledgerSignId !== this.lastLedgerSignId) {
      return;
    }

    this.confirmationTimeout = new Date(new Date().getTime() + 25000);
    this.updateConfirmationCountdown();

    let signedTx;
    try {
      signedTx = await ledger.signTransaction(accountSlot, unsignedTx);
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
    const { account, passphrasePublicKey, ledgerStore } = this.injected;
    const { transaction } = this.state;
    const { ledger } = this;

    return (
      <ConfirmTransactionDialogContent
        data={transaction!}
        fee={this.fee}
        senderName={account.name}
        senderAddress={account.id}
      >
        {account.type === AccountType.LEDGER ? (
          !ledgerStore.hasBrowserSupport ? (
            <ConfirmTxStatusFooter type="ledger-not-supported" />
          ) : ledger.deviceId === null ? (
            <ConfirmTxStatusFooter type="ledger-not-connected" />
          ) : ledger.deviceId !== account.hwId ? (
            <ConfirmTxStatusFooter type="ledger-another-device" />
          ) : (
            <ConfirmTxStatusFooter
              type="ledger-confirming"
              timeout={this.countdownSeconds}
            />
          )
        ) : (
          <ConfirmTxEnterSecretsFooter
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
        data={transaction!}
        fee={this.fee}
        senderName={account.name}
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
        data={transaction!}
        fee={this.fee}
        senderName={account.name}
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
        data={transaction!}
        fee={this.fee}
        senderName={account.name}
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
    const remainMs = this.confirmationTimeout !== null ? this.confirmationTimeout.getTime() - now.getTime() : 0;
    const isCountdownActive = remainMs > 0;

    runInAction(() => {
      if (isCountdownActive) {
        this.countdownSeconds = Math.ceil(remainMs / 1000);
      } else {
        // Make sure that the timeout clears the selected account
        this.lastLedgerSignId += 1;
        this.goBack();
      }
    });

    if (isCountdownActive && this.countdownId === null) {
      this.countdownId = window.setInterval(this.updateConfirmationCountdown, 250);
    } else if (!isCountdownActive && this.countdownId !== null) {
      window.clearInterval(this.countdownId);
      this.countdownId = null;
    }
  }
}

export default TransactionDialog;
