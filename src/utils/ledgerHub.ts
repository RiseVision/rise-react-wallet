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
  curLock = new Promise((resolve) => release = resolve);
  return curAwaitableLock.then(() => release);
}
export function WrapInSequence() {
  return (target: any,
          method: string,
          descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>) => {
    const oldValue = descriptor.value!;

    descriptor.value = async function wrapInSequence(...args: any[]) {
      const release = await acquireLock();
      try {
        const toRet = await oldValue.apply(this, args);
        setTimeout(release, 1);
        return toRet;
      } catch (e) {
        setTimeout(release, 1);
        throw e;
      }
    };
  };
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
let ledgerTransport: null | (ITransport & { close(): Promise<void>, setExchangeTimeout(timeout: number): void }) = null;

// monitor USB changes and delete the transport cache

async function createOrReuseTransport() {
  console.log('createOrReuseTransport');
  // cached
  if (ledgerTransport) {
    return ledgerTransport;
  }
  if (!isElectron()) {
    // @ts-ignore
    ledgerTransport = await TransportU2F.create();
  }
  return ledgerTransport;
}

export class LedgerChannel {
  isOpen = true;

  constructor(public hub: LedgerHub, public channelId: number) {}

  get deviceId(): null | string {
    if (!this.isOpen) {
      return null;
    }
    return this.hub.deviceId;
  }

  @WrapInSequence()
  async getAccount(accountSlot: number): Promise<LedgerAccount> {
    if (!this.isOpen) {
      return Promise.reject(new LedgerUnreachableError());
    }
    return this.hub.getAccount(accountSlot);
  }

  @WrapInSequence()
  async confirmAccount(accountSlot: number): Promise<boolean> {
    if (!this.isOpen) {
      return Promise.reject(new LedgerUnreachableError());
    }
    return this.hub.confirmAccount(accountSlot);
  }

  @WrapInSequence()
  async signTransaction(
    accountSlot: number,
    unsignedTx: RiseTransaction
  ): Promise<null | PostableRiseTransaction> {
    if (!this.isOpen) {
      throw new LedgerUnreachableError();
    }
    return this.hub.signTransaction(
      accountSlot,
      unsignedTx
    );
  }

  async close() {
    if (this.isOpen) {
      this.hub.closeChannel();
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
    this.hasSupport = isElectron() || TransportU2F.isSupported();

    if (isElectron()) {
      const self = this;
      electronRequire('@ledgerhq/hw-transport-node-hid').default.listen({
        async next(evt: {device: any, type: 'add'|'remove'}) {
          console.log(evt.type);
          if (ledgerTransport) {
            await ledgerTransport.close();
            ledgerTransport = null;
          }
          if (evt.type === 'add') {
            ledgerTransport = await electronRequire('@ledgerhq/hw-transport-node-hid')
              .default.open(evt.device.path);
            runInAction(() => {
              self.hasSupport = true;
              self.deviceId = null;
            });

            await self.ping();
          } else {
            // no more usb devices attached.
            runInAction(() => {
              self.hasSupport = false;
              self.deviceId = null;
            });
          }
        }
      });
    } else {
      setInterval(() => this.ping(), 500);
    }
  }

  openChannel(): LedgerChannel {
    return new LedgerChannel(this, 1);
  }

  closeChannel(): void {
     // Noop
  }

  async getAccount(accountSlot: number, showOnLedger: boolean = false): Promise<LedgerAccount> {
    if (this.deviceId === null) {
      throw new LedgerUnreachableError();
    }
    if (!this.accountCache[accountSlot]) {
      const accountPath = new DposAccount()
        .coinIndex(SupportedCoin.RISE)
        .account(accountSlot);

      const comm = await this.getDposLedger(showOnLedger ? 'long' : 'short' );

      this.accountCache[accountSlot] = await comm.getPubKey(accountPath, showOnLedger)
        .catch(this.remapLedgerError());
    }
    return this.accountCache[accountSlot];
  }

  async confirmAccount(accountSlot: number): Promise<boolean> {
    try {
      await this.getAccount(accountSlot, true);
      return true;
    } catch (e) {
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
      unsignedTx.signature = (await comm.signTX(
        accountPath,
        txBytes,
        false
      )) as Buffer & As<'signature'>;
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

      const {address: deviceId} = value;
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
      console.log('error in ping');
    }
  }

  private async getDposLedger(operationType: 'short'|'long' = 'short'): Promise<DposLedger> {
    // @ts-ignore wrong d.ts
    const transport = await createOrReuseTransport();
    if (!transport) {
      console.log('no-transport');
      throw new Error('No valid transports found for ledger');
    }
    transport.setExchangeTimeout(operationType === 'short' ? 5000 : 30000);

    return new DposLedger(transport);
  }

  private remapLedgerError() {
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

/**
 * Required because of differences in handling of default imports in
 * CRA vs TS+node.
 *
 * https://github.com/electron/electron/issues/2288
 */
function isElectron() {
  // Renderer process
  if (
    typeof window !== 'undefined' &&
    // @ts-ignore
    typeof window.process === 'object' &&
    // @ts-ignore
    window.process.type === 'renderer'
  ) {
    return true;
  }

  // Main process
  if (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    !!process.versions.electron
  ) {
    return true;
  }

  // Detect the user agent when the `nodeIntegration` option is set to true
  if (
    typeof navigator === 'object' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.indexOf('Electron') >= 0
  ) {
    return true;
  }

  return false;
}
