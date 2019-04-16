// @ts-ignore TODO type
import Transport from '@ledgerhq/hw-transport';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import {
  DposLedger,
  SupportedCoin,
  LedgerAccount as DposAccount,
} from 'dpos-ledger-api';
import {
  CommHandler
} from 'dpos-ledger-api/dist/es5/commHandler';
import { Rise } from 'dpos-offline';
import { observable, runInAction, action } from 'mobx';
import * as React from 'react';
import { As } from 'type-tagger';
import { PostableRiseTransaction, RiseTransaction } from './wallet';

/** Simple logging util (linter friendly) */
// tslint:disable-next-line:no-unused-expression
function log(...msg: string[]) {
  console.log(...msg);
}

export interface LedgerAccount {
  publicKey: string;
  address: string;
}

export class LedgerUnreachableError extends Error {
  constructor() {
    super('Ledger device unreachable');
  }
}

export class LedgerLockedError extends Error {
  constructor() {
    super('Ledger device locked');
  }
}

export class LedgerConfirmError extends Error {
  constructor() {
    super('Ledger tx confirmation failed');
  }
}

export class LedgerUnknownError extends Error {
  constructor(public org: ILedgerInternalError) {
    super('Ledger device locked');
  }
}

export interface ILedgerInternalError {
  id: string;
  statusCode: number;
}

export default class LedgerStore {
  @observable hasSupport: boolean = false;
  @observable isOpen: boolean = false;
  @observable device: null | USBDevice = null;
  @observable transport: null | Transport = null;
  @observable eventContext: React.MouseEvent<HTMLAnchorElement>;

  // private pingInterval: null | number = null;
  // private pingMutex = new Mutex();
  // private lastPing?: number;
  private accountCache: {
    [slot: number]: LedgerAccount;
  } = {};
  constructor() {
    // pass async
    this.init();
  }

  async init() {
    try {
      // @ts-ignore missing d.ts
      const hasSupport = await TransportWebUSB.isSupported();
      runInAction(() => {
        this.hasSupport = hasSupport;
      });
    } catch (e) {
      // catch non-supported browsers
      // TODO test for webusb
      if (!e.id || e.id !== 'U2FNotSupported') {
        throw e;
      }
    }
  }

  async open(): Promise<void> {
    // assert(this.eventContext, 'eventContext required');
    // return new Promise(resolve => {
    //   const observer: Observer<DescriptorEvent<USBDevice>> = {
    //     next: action((e: DescriptorEvent<USBDevice>) => {
    //       this.isOpen = true;
    //       this.device = e.descriptor;
    //       resolve();
    //     }),
    //     error: action(err => {
    //       this.isOpen = false;
    //       this.device = null;
    //       resolve();
    //     }),
    //     complete: () => {}
    //   };
    //   LedgerTransport.listen.call(event, observer);
    // });
    const transport = await TransportWebUSB.create();
    console.log(transport);
    runInAction(() => {
      this.transport = transport;
      this.device = transport.device;
      this.isOpen = true;
    });
  }

  @action
  close() {
    this.transport = null;
    this.device = null;
    this.isOpen = false;
  }

  async getAccount(
    accountSlot: number,
    showOnLedger: boolean = false
  ): Promise<LedgerAccount> {
    if (!this.transport) {
      throw new LedgerUnreachableError();
    }
    if (!this.accountCache[accountSlot] || showOnLedger) {
      const accountPath = new DposAccount()
        .coinIndex(SupportedCoin.RISE)
        .account(accountSlot);

      const comm = await this.getRiseTransport(showOnLedger ? 'long' : 'short');

      this.accountCache[accountSlot] = await comm.getPubKey(
        accountPath,
        showOnLedger
      );
    }
    return this.accountCache[accountSlot];
  }

  async confirmAccount(accountSlot: number): Promise<boolean> {
    try {
      await this.getAccount(accountSlot, true);
      return true;
    } catch (e) {
      const error = handleLedgerError(e);
      if (error instanceof LedgerConfirmError) {
        log('Error when confirming account', e);
      }
      return false;
    }
  }

  async signTransaction(
    accountSlot: number,
    unsignedTx: RiseTransaction
  ): Promise<null | PostableRiseTransaction> {
    if (!this.device) {
      throw new LedgerUnreachableError();
    }
    const accountPath = new DposAccount()
      .coinIndex(SupportedCoin.RISE)
      .account(accountSlot);

    const account = await this.getAccount(accountSlot, false);

    unsignedTx.senderPublicKey = Buffer.from(
      account.publicKey,
      'hex'
    ) as Buffer & As<'publicKey'>;
    const txBytes = Rise.txs.bytes(unsignedTx);

    let signedTx: null | PostableRiseTransaction;
    const comm = await this.getRiseTransport('long');
    try {
      log('confirming on the ledger, check the device');
      const signature = await comm.signTX(accountPath, txBytes);
      unsignedTx.signature = signature as Buffer & As<'signature'>;
      signedTx = Rise.txs.toPostable(unsignedTx);
    } catch (e) {
      console.log('LedgerConfirmError', e);
      const error = handleLedgerError(e);
      if (error instanceof LedgerConfirmError) {
        // TODO
        signedTx = null;
      } else {
        throw e;
      }
    }

    return signedTx;
  }

  private async getRiseTransport(
    operationType: 'short' | 'long' = 'short'
  ): Promise<DposLedger> {
    this.transport.setExchangeTimeout(operationType === 'short' ? 5000 : 30000);
    return new DposLedger(new CommHandler(this.transport));
  }
}

function handleLedgerError(
  ex: ILedgerInternalError
): LedgerUnreachableError | LedgerLockedError | LedgerUnknownError {
  // Map known errors to new exception types
  if (ex.id === 'U2F_5') {
    // Device not connected
    return new LedgerUnreachableError();
  } else if (ex.statusCode === 0x6804) {
    // Device locked
    return new LedgerLockedError();
  } else if (ex.statusCode === 0x6985) {
    // Tx confirmation failed
    return new LedgerConfirmError();
  } else {
    // Other errors
    return new LedgerUnknownError(ex);
  }
}
