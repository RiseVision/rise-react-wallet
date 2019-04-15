import TransportU2F from '@ledgerhq/hw-transport-u2f';
// TODO merge these
import {
  DposLedger,
  SupportedCoin,
  LedgerAccount as DposAccount
} from 'dpos-ledger-api';
import { ITransport } from 'dpos-ledger-api/dist/es5/ledger';
import { CommHandler } from 'dpos-ledger-api/dist/es5/commHandler';
import { Rise } from 'dpos-offline';
import { observable, runInAction } from 'mobx';
import { As } from 'type-tagger';
import { PostableRiseTransaction, RiseTransaction } from './wallet';
import { Mutex } from 'async-mutex';

/** Simple logging util (linter friendly) */
// tslint:disable-next-line:no-unused-expression
function log(...msg: any[]) {
  // console.log(...msg);
}

export interface LedgerAccount {
  publicKey: string;
  address: string;
}

const PING_ACCOUNT_SLOT = 0;

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

// cache the transport
let ledgerTransport:
  | null
  | (ITransport & {
      close(): Promise<void>;
      setExchangeTimeout(timeout: number): void;
    }) = null;

// monitor USB changes and delete the transport cache

async function createOrReuseTransport() {
  log('createOrReuseTransport');
  // cached
  if (!ledgerTransport) {
    log('miss cache');
    // @ts-ignore
    ledgerTransport = await TransportU2F.create();
  }
  return ledgerTransport;
}

export default class LedgerStore {
  @observable hasSupport: boolean = false;
  @observable isOpen: boolean = false;
  @observable deviceId: null | string = null;

  confirmationTimeout = 10000;

  private pingInterval: null | number = null;
  private mutex = new Mutex();
  private lastPing?: number;
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
      const hasSupport = await TransportU2F.isSupported();
      runInAction(() => {
        this.hasSupport = hasSupport;
      });
    } catch (e) {
      // catch non-supported browsers
      if (!e.id || e.id !== 'U2FNotSupported') {
        throw e;
      }
    } finally {
      this.handlePing();
    }
  }

  open() {
    this.isOpen = true;
    this.handlePing();
  }

  close() {
    this.handlePing();
  }

  async getAccount(
    accountSlot: number,
    showOnLedger: boolean = false
  ): Promise<LedgerAccount> {
    if (this.deviceId === null) {
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
    if (this.deviceId === null) {
      throw new LedgerUnreachableError();
    }
    const release = await this.mutex.acquire();
    try {
      await this.getAccount(accountSlot, true);
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
    if (this.deviceId === null) {
      throw new LedgerUnreachableError();
    }
    const release = await this.mutex.acquire();

    try {
      const accountPath = new DposAccount()
        .coinIndex(SupportedCoin.RISE)
        .account(accountSlot);

      const account = await this.getAccountUnsafe(accountSlot, false);
      log('got account data', account);

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
        log('got signature', signature);

        unsignedTx.signature = signature as Buffer & As<'signature'>;
        signedTx = Rise.txs.toPostable(unsignedTx);
      } catch (e) {
        console.log('signTransaction error', e);
        const error = mapLedgerError(e);
        if (error instanceof LedgerConfirmError) {
          // TODO
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
    if (this.deviceId === null) {
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

  protected handlePing() {
    const shouldPing = this.hasSupport && this.isOpen;

    if (shouldPing && this.pingInterval === null) {
      log('Starting pinging device periodically...');
      this.pingInterval = window.setInterval(() => this.ping(), 1000);
      // Fire off initial ping immediately
      this.ping();
    } else if (!shouldPing && this.pingInterval !== null) {
      log('Stopping pinging device...');
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private async ping(): Promise<void> {
    // We ping the device periodically to see if it's actually connected and to
    // get the connected device id. Since there's no actual API present that would
    // provide us with the device ID, we rely on the account at path 44'/1120'/0'
    // to fingerprint the currently connected device.
    if (!this.isOpen) {
      log('Skipping pinging, ledger not open...');
      return;
    }

    const release = await this.mutex.acquire();
    const now = new Date().getTime();
    if (this.lastPing && now - this.lastPing < 500) {
      log('Skipping pinging, too soon...');
      release();
      return;
    }
    this.lastPing = now;

    const accountPath = new DposAccount()
      .coinIndex(SupportedCoin.RISE)
      .account(PING_ACCOUNT_SLOT);

    const comm = await this.getRiseTransport();

    try {
      const value = await comm.getPubKey(accountPath, false);
      runInAction(() => {
        const deviceId = (value && value.address) || null;
        if (deviceId !== this.deviceId) {
          this.deviceId = deviceId;
          this.accountCache = {};
          if (value !== null) {
            this.accountCache[PING_ACCOUNT_SLOT] = value;
          }
        }
        if (!deviceId) {
          this.isOpen = false;
        }
      });
    } catch (e) {
      log('Error pinging the device', e);
      runInAction(() => {
        this.deviceId = null;
      });
    } finally {
      release();
    }
  }

  private async getRiseTransport(
    operationType: 'short' | 'long' = 'short'
  ): Promise<DposLedger> {
    // @ts-ignore wrong d.ts
    const transport = await createOrReuseTransport();
    if (!transport) {
      log('no-transport');
      throw new Error('No valid transports found for ledger');
    }
    transport.setExchangeTimeout(
      operationType === 'short' ? 5000 : this.confirmationTimeout
    );

    return new DposLedger(new CommHandler(transport));
  }
}

function mapLedgerError(
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
