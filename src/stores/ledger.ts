// @ts-ignore TODO type
import Transport from '@ledgerhq/hw-transport';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import {
  DposLedger,
  SupportedCoin,
  LedgerAccount as DposAccount
} from 'dpos-ledger-api';
import { CommHandler } from 'dpos-ledger-api/dist/es5/commHandler';
import { Rise } from 'dpos-offline';
import { observable, runInAction, action } from 'mobx';
import * as React from 'react';
import { As } from 'type-tagger';
import { PostableRiseTransaction, RiseTransaction } from './wallet';
import { Mutex } from 'async-mutex';

/** Simple logging util (linter friendly) */
// tslint:disable-next-line:no-unused-expression
function log(...msg: string[]) {
  console.log(...msg);
}

export interface LedgerAccount {
  publicKey: string;
  address: string;
  slot: number;
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
  // @observable deviceId: null | string = null;
  @observable device: null | USBDevice = null;
  @observable transport: null | Transport = null;
  @observable eventContext: React.MouseEvent<HTMLAnchorElement>;

  private mutex = new Mutex();
  confirmationTimeout = 30000;

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
      console.error('ledger init error', e);
      if (!e.id || e.id !== 'U2FNotSupported') {
        throw e;
      }
    }
  }

  async open(): Promise<boolean> {
    // TODO enable
    // if (this.open) {
    //   return true
    // }
    const transport = await TransportWebUSB.create();
    log('transport', transport);
    if (!transport) {
      return false;
    }
    runInAction(() => {
      this.transport = transport;
      this.device = transport.device;
      this.isOpen = true;
    });
    return true;
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
    const release = await this.mutex.acquire();
    try {
      return await this.getAccountUnsafe(accountSlot, showOnLedger);
    } finally {
      release();
    }
  }

  async confirmAccount(accountSlot: number): Promise<boolean> {
    const release = await this.mutex.acquire();
    try {
      await this.getAccountUnsafe(accountSlot, true);
      return true;
    } catch (e) {
      const error = mapLedgerError(e);
      if (error instanceof LedgerConfirmError) {
        log('Error when confirming account', e);
      }
      return false;
    } finally {
      release();
    }
  }

  async signTransaction(
    accountSlot: number,
    unsignedTx: RiseTransaction
  ): Promise<null | PostableRiseTransaction> {
    if (!this.device) {
      throw new LedgerUnreachableError();
    }
    const release = await this.mutex.acquire();
    try {
      const accountPath = new DposAccount()
        .coinIndex(SupportedCoin.RISE)
        .account(accountSlot);

      const account = await this.getAccountUnsafe(accountSlot, false);

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
        const error = mapLedgerError(e);
        if (error instanceof LedgerConfirmError) {
          signedTx = null;
        } else {
          throw e;
        }
      }

      return signedTx;
    } finally {
      release();
    }
  }

  protected async getAccountUnsafe(
    accountSlot: number,
    showOnLedger: boolean = false
  ): Promise<LedgerAccount> {
    if (!this.accountCache[accountSlot] || showOnLedger) {
      const accountPath = new DposAccount()
        .coinIndex(SupportedCoin.RISE)
        .account(accountSlot);

      const comm = await this.getRiseTransport(showOnLedger ? 'long' : 'short');

      const data = await comm.getPubKey(accountPath, showOnLedger);
      // TODO remove once fixed in the driver
      data.address = data.address.replace('L', 'R');
      this.accountCache[accountSlot] = { slot: accountSlot, ...data };
    }
    return this.accountCache[accountSlot];
  }

  private async getRiseTransport(
    operationType: 'short' | 'long' = 'short'
  ): Promise<DposLedger> {
    this.transport.setExchangeTimeout(
      operationType === 'short' ? 5000 : this.confirmationTimeout
    );
    return new DposLedger(new CommHandler(this.transport));
  }
}

// Map known errors to new exception types
function mapLedgerError(
  ex: ILedgerInternalError
): LedgerUnreachableError | LedgerLockedError | LedgerUnknownError {
  if (ex.statusCode === 0x6804) {
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
