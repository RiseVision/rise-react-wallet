import TransportU2F from '@ledgerhq/hw-transport-u2f';
import {
  DposLedger,
  SupportedCoin,
  LedgerAccount as DposAccount
} from 'dpos-ledger-api';
import { Rise } from 'dpos-offline';
import { observable, runInAction } from 'mobx';
import { As } from 'type-tagger';
import { PostableRiseTransaction, RiseTransaction } from '../stores/wallet';
import { ITransport } from 'dpos-ledger-api/dist/es5/ledger';

let curLock: Promise<void> = Promise.resolve(void 0);
function acquireLock(): Promise<() => void> {
  const curAwaitableLock = curLock;
  let release: () => void;
  curLock = new Promise(resolve => (release = resolve));
  return curAwaitableLock.then(() => release);
}
export function WrapInSequence() {
  return (
    // tslint:disable-next-line:no-any
    target: any,
    method: string,
    // tslint:disable-next-line:no-any
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
  ) => {
    const oldValue = descriptor.value!;

    // tslint:disable-next-line:no-any
    descriptor.value = async function wrapInSequence(...args: any[]) {
      const release = await acquireLock();
      try {
        return await oldValue.apply(this, args);
      } catch (e) {
        throw e;
      } finally {
        setTimeout(release, 1);
      }
    };
  };
}

/** Simple logging util (linter friendly) */
// tslint:disable-next-line:no-unused-expression
function log(...msg: string[]) {
  // console.log(...msg)
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

export class LedgerChannel {
  get deviceId(): null | string {
    if (!this.isOpen) {
      return null;
    }
    return this.hub.deviceId;
  }
  isOpen = true;

  /**
   * Decorator to run underlying function only if channel is marked as open
   */
  private static runOnlyIfOpen() {
    return (
      target: LedgerChannel,
      method: string,
      // tslint:disable-next-line:no-any
      descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
    ) => {
      const oldValue = descriptor.value!;
      // tslint:disable-next-line:no-any
      descriptor.value = async function runOnlyIfOpen(...args: any[]) {
        if (!(this as LedgerChannel).isOpen) {
          return Promise.reject(new LedgerUnreachableError());
        }
        return oldValue.apply(this, args);
      };
    };
  }

  /**
   * Handles U2F error 5 (apparently disconnection) to mark the channel as closed
   *
   * TODO use error codes directly from the Transport's enum
   */
  private static handleChannelError() {
    return (
      target: LedgerChannel,
      method: string,
      // tslint:disable-next-line:no-any
      descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
    ) => {
      const oldValue = descriptor.value!;
      descriptor.value = async function wrapLedgerChannelMethod(
        // tslint:disable-next-line:no-any
        ...args: any[]
      ) {
        // tslint:disable-next-line:no-any
        return oldValue.apply(this, args).catch(async (e: any) => {
          if (e.id === 'U2F_5' || e instanceof LedgerUnreachableError) {
            // Channel closed.
            await (this as LedgerChannel).close();
          }
          throw e;
        });
      };
    };
  }

  constructor(public hub: LedgerHub) {}

  @WrapInSequence()
  @LedgerChannel.handleChannelError()
  @LedgerChannel.runOnlyIfOpen()
  async getAccount(accountSlot: number): Promise<LedgerAccount> {
    return this.hub.getAccount(accountSlot);
  }

  @WrapInSequence()
  @LedgerChannel.handleChannelError()
  @LedgerChannel.runOnlyIfOpen()
  async confirmAccount(accountSlot: number): Promise<boolean> {
    // baubau
    return this.hub.confirmAccount(accountSlot);
  }

  @WrapInSequence()
  @LedgerChannel.handleChannelError()
  @LedgerChannel.runOnlyIfOpen()
  async signTransaction(
    accountSlot: number,
    unsignedTx: RiseTransaction
  ): Promise<null | PostableRiseTransaction> {
    return this.hub.signTransaction(accountSlot, unsignedTx);
  }

  async close() {
    if (this.isOpen) {
      this.isOpen = false;
    }
  }
}

/**
 * LedgerHub is an abstraction layer that serializes various API requests to the device
 * so that the UI layer wouldn't have to worry about the fact that Ledger doesn't handle
 * parallel requests.
 *
 * In addition to managing the requests, it also handles determining wether the device
 * is connected to the computer and caching of cachable requests (eg getAddress).
 *
 * TODO loose observables
 */
export default class LedgerHub {
  @observable hasSupport: boolean = false;
  @observable deviceId: null | string = null;

  private accountCache: {
    [slot: number]: LedgerAccount;
  } = {};
  constructor() {
    // @ts-ignore missing d.ts
    this.hasSupport = TransportU2F.isSupported();

    setInterval(() => this.ping(), 1000);
  }

  openChannel(): LedgerChannel {
    return new LedgerChannel(this);
  }

  async getAccount(
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

      const comm = await this.getDposLedger(showOnLedger ? 'long' : 'short');

      this.accountCache[accountSlot] = await comm
        .getPubKey(accountPath, showOnLedger)
        .catch(this.remapLedgerError());
    }
    return this.accountCache[accountSlot];
  }

  async confirmAccount(accountSlot: number): Promise<boolean> {
    try {
      await this.getAccount(accountSlot, true);
      return true;
    } catch (e) {
      if (e.statusCode !== 0x6985) {
        log('Error when confirming account', e);
      }
      return false;
    }
  }

  async signTransaction(
    accountSlot: number,
    unsignedTx: RiseTransaction
  ): Promise<null | PostableRiseTransaction> {
    if (this.deviceId === null) {
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
    const comm = await this.getDposLedger('long');
    try {
      unsignedTx.signature = (await comm
        .signTX(accountPath, txBytes, false)
        .catch(this.remapLedgerError())) as Buffer & As<'signature'>;
      signedTx = Rise.txs.toPostable(unsignedTx);
    } catch (ex) {
      if (ex.statusCode === 0x6985) {
        signedTx = null;
      } else {
        throw ex;
      }
    }

    return signedTx;
  }

  @WrapInSequence()
  private async ping(): Promise<void> {
    // We ping the device periodically to see if it's actually connected and to
    // get the connected device id. Since there's no actual API present that would
    // provide us with the device ID, we rely on the account at path 44'/1120'/0'
    // to fingerprint the currently connected device.
    // TODO extract
    const accountPath = new DposAccount()
      .coinIndex(SupportedCoin.RISE)
      .account(PING_ACCOUNT_SLOT);

    const comm = await this.getDposLedger();

    try {
      const value = await comm.getPubKey(accountPath, false);

      const { address: deviceId } = value;
      runInAction(() => {
        if (deviceId !== this.deviceId) {
          this.deviceId = deviceId;
          this.accountCache = {};
          if (value !== null) {
            this.accountCache[PING_ACCOUNT_SLOT] = value;
          }
        }
      });
    } catch (e) {
      log(e);
      log('error in ping');
    }
  }

  private async getDposLedger(
    operationType: 'short' | 'long' = 'short'
  ): Promise<DposLedger> {
    // @ts-ignore wrong d.ts
    const transport = await createOrReuseTransport();
    if (!transport) {
      log('no-transport');
      throw new Error('No valid transports found for ledger');
    }
    transport.setExchangeTimeout(operationType === 'short' ? 5000 : 30000);

    return new DposLedger(transport);
  }

  private remapLedgerError() {
    // tslint:disable-next-line:no-any
    return async (ex: any) => {
      // Map known errors to new exception types
      if (ex.id === 'U2F_5') {
        // Device not connected
        throw new LedgerUnreachableError();
      } else if (ex.statusCode === 0x6804) {
        // Device locked
        throw new LedgerLockedError();
      } else {
        // Other errors
        throw ex;
      }
    };
  }
}
