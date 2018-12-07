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

interface LedgerTaskRunner {
  processTasks(): void;
}

function getTransport() {
  if (isElectron()) {
    return electronRequire('@ledgerhq/hw-transport-node-hid').default;
  }
  return TransportU2F;
}

// cache the transport
let ledgerTransport = null;

// monitor USB changes and delete the transport cache
let usbDetect;
if (isElectron()) {
  usbDetect = electronRequire('usb-detection');
  usbDetect.startMonitoring();
  usbDetect.on('change', () => {
    console.log('change');
    ledgerTransport = null;
  });
}

async function createTransport() {
  console.log('createTransport');
  // cached
  if (ledgerTransport) {
    return ledgerTransport;
  }
  if (isElectron()) {
    ledgerTransport = await createTransportNodeHID();
  } else {
    // @ts-ignore
    ledgerTransport = await TransportU2F.create();
  }
  return ledgerTransport;
}

class LedgerTask<T> {
  executioner: LedgerTaskRunner;
  private state: 'pending' | 'executing' | 'done' = 'pending';

  constructor(
    readonly channelId: null | number,
    private resolve: (value: T) => void,
    private reject: (reason: Error) => void,
    private runner: () => Promise<T>
  ) {}

  get isPending(): boolean {
    return this.state === 'pending';
  }

  get isDone(): boolean {
    return this.state === 'done';
  }

  get isExecuting(): boolean {
    return this.state === 'executing';
  }

  async start() {
    if (this.state !== 'pending') {
      throw new Error('Invalid task state');
    }

    // timeout
    // setTimeout(() => {
    //   if (this.state === 'executing') {
    //     console.log('forced timeout');
    //     this.state = 'done';
    //   }
    // }, 1000);

    this.state = 'executing';
    try {
      const value = await this.runner();
      if (this.state === 'executing') {
        this.state = 'done';
        this.resolve(value);
      }
    } catch (ex) {
      if (this.state === 'executing') {
        this.state = 'done';

        // Map known errors to new exception types
        if (ex.id === 'U2F_5') {
          // Device not connected
          this.reject(new LedgerUnreachableError());
        } else if (ex.statusCode === 0x6804) {
          // Device locked
          this.reject(new LedgerLockedError());
        } else {
          // Other errors
          this.reject(ex);
        }
      }
    } finally {
      // Schedule next task
      this.executioner.processTasks();
    }
  }

  cancel(reason: Error) {
    if (this.state === 'done') {
      throw new Error('Invalid task state');
    }

    this.state = 'done';
    this.reject(reason);
  }
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

  async getAccount(accountSlot: number): Promise<LedgerAccount> {
    if (!this.isOpen) {
      return Promise.reject(new LedgerUnreachableError());
    }
    return await this.hub.getAccount(this.channelId, accountSlot);
  }

  async confirmAccount(accountSlot: number): Promise<boolean> {
    if (!this.isOpen) {
      return Promise.reject(new LedgerUnreachableError());
    }
    return await this.hub.confirmAccount(this.channelId, accountSlot);
  }

  async signTransaction(
    accountSlot: number,
    unsignedTx: RiseTransaction
  ): Promise<null | PostableRiseTransaction> {
    if (!this.isOpen) {
      throw new LedgerUnreachableError();
    }
    return await this.hub.signTransaction(
      this.channelId,
      accountSlot,
      unsignedTx
    );
  }

  async close() {
    if (this.isOpen) {
      this.hub.closeChannel(this.channelId);
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
export default class LedgerHub implements LedgerTaskRunner {
  @observable hasBrowserSupport: boolean = false;
  @observable deviceId: null | string = null;

  private processIntervalId: null | any = null;
  private lastChannelId = 0;
  private channelCount = 0;
  private lastPing: null | Date = null;
  private lastSend: null | Date = null;

  private accountCache: {
    [slot: number]: LedgerAccount;
  } = {};
  private taskQueue: LedgerTask<{}>[] = [];

  constructor() {
    // clear the task queue on USB changes
    if (isElectron()) {
      usbDetect.on('change', () => {
        this.taskQueue = [];
      });
    }
    this.detectBrowserSupport();
  }

  processTasks() {
    console.log('processTasks');
    const now = new Date();

    const activeTask = this.taskQueue.find(t => t.isExecuting);
    // When a task is running there's nothing left to do for now
    if (activeTask) {
      return;
    }

    // Make sure there's at least 75ms between tasks
    if (
      this.lastSend !== null &&
      now.getTime() - this.lastSend.getTime() < 75
    ) {
      return;
    }

    let task: null | LedgerTask<{}> = null;

    // Every 3 seconds run the ping task ignoring the queued ones
    if (
      this.lastPing === null ||
      now.getTime() - this.lastPing.getTime() > 3000
    ) {
      console.log('ping');
      task = this.injectPingTask();
    }

    if (task === null) {
      task = this.taskQueue.find(t => t.isPending) || null;
    }

    // Start executing the task
    if (task !== null) {
      task.start();
      this.lastSend = now;
    }

    // Enable/disable the automatic task processing
    const shouldAutoProcess =
      this.channelCount > 0 ||
      (this.lastSend && now.getTime() - this.lastSend.getTime() < 5000);
    if (shouldAutoProcess && this.processIntervalId === null) {
      this.processIntervalId = setInterval(() => this.processTasks(), 1000);
    } else if (!shouldAutoProcess && this.processIntervalId !== null) {
      clearInterval(this.processIntervalId);
      this.processIntervalId = null;
    }
  }

  scheduleTask<T>(task: LedgerTask<T>) {
    task.executioner = this;
    this.taskQueue.push(task as LedgerTask<{}>);
    this.processTasks();
  }

  openChannel(): LedgerChannel {
    const channelId = ++this.lastChannelId;
    try {
      this.channelCount += 1;
      return new LedgerChannel(this, channelId);
    } finally {
      if (this.channelCount === 1) {
        // Send the initial ping
        this.processTasks();
      }
    }
  }

  closeChannel(channelId: number): void {
    this.channelCount -= 1;

    // Cancel all pending requests on the channel
    this.taskQueue
      .filter(t => t.channelId === channelId)
      .filter(t => !t.isDone)
      .forEach(t => t.cancel(new LedgerUnreachableError()));
    this.taskQueue = this.taskQueue.filter(t => !t.isDone);

    // Start work on the next task as cancelling doesn't do that automatically
    this.processTasks();
  }

  getAccount(channelId: number, accountSlot: number): Promise<LedgerAccount> {
    return new Promise((resolve, reject) => {
      if (this.deviceId === null) {
        reject(new LedgerUnreachableError());
      }

      // Check account cache
      if (this.accountCache[accountSlot]) {
        resolve(this.accountCache[accountSlot]);
      }

      // Schedule the task
      const task = new LedgerTask(
        channelId,
        value => {
          this.accountCache[accountSlot] = value;
          resolve(value);
        },
        reject,
        async () => {
          const accountPath = new DposAccount()
            .coinIndex(SupportedCoin.RISE)
            .account(accountSlot);

          // @ts-ignore wrong d.ts
          const transport = await createTransport();
          if (!transport) {
            return;
          }
          transport.setExchangeTimeout(5000);

          const comm = new DposLedger(transport);
          return (await comm.getPubKey(accountPath)) as LedgerAccount;
        }
      );

      this.scheduleTask(task);
    });
  }

  confirmAccount(channelId: number, accountSlot: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.deviceId === null) {
        reject(new LedgerUnreachableError());
      }

      // Schedule the task
      const task = new LedgerTask(channelId, resolve, reject, async () => {
        const accountPath = new DposAccount()
          .coinIndex(SupportedCoin.RISE)
          .account(accountSlot);

        // @ts-ignore wrong d.ts
        const transport = await createTransport();
        if (!transport) {
          return;
        }
        transport.setExchangeTimeout(30000);

        const comm = new DposLedger(transport);
        try {
          await comm.getPubKey(accountPath, true);
          return true;
        } catch (ex) {
          if (ex.statusCode === 0x6985) {
            return false;
          } else {
            throw ex;
          }
        }
      });

      this.scheduleTask(task);
    });
  }

  signTransaction(
    channelId: number,
    accountSlot: number,
    unsignedTx: RiseTransaction
  ): Promise<null | PostableRiseTransaction> {
    return new Promise((resolve, reject) => {
      if (this.deviceId === null) {
        reject(new LedgerUnreachableError());
      }

      // Schedule the task
      const task = new LedgerTask(
        channelId,
        ({ account, signedTx }) => {
          // Add the account to the cache if we had cache-miss in the task runner
          if (!this.accountCache[accountSlot]) {
            this.accountCache[accountSlot] = account;
          }
          resolve(signedTx);
        },
        reject,
        async () => {
          const accountPath = new DposAccount()
            .coinIndex(SupportedCoin.RISE)
            .account(accountSlot);

          // @ts-ignore wrong d.ts
          const transport = await createTransport();
          if (!transport) {
            return;
          }
          const comm = new DposLedger(transport);

          let account = this.accountCache[accountSlot];
          if (!account) {
            transport.setExchangeTimeout(5000);
            account = (await comm.getPubKey(accountPath)) as LedgerAccount;
          }

          unsignedTx.senderPublicKey = Buffer.from(
            account.publicKey,
            'hex'
          ) as Buffer & As<'publicKey'>;
          const txBytes = Rise.txs.bytes(unsignedTx);

          let signedTx: null | PostableRiseTransaction;
          transport.setExchangeTimeout(30000);
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

          return { account, signedTx };
        }
      );

      this.scheduleTask(task);
    });
  }

  private async detectBrowserSupport() {
    // @ts-ignore missing d.ts
    const isSupported = await getTransport().isSupported();

    runInAction(() => {
      this.hasBrowserSupport = isSupported;
    });
  }

  private injectPingTask(): LedgerTask<{}> {
    // We ping the device periodically to see if it's actually connected and to
    // get the connected device id. Since there's no actual API present that would
    // provide us with the device ID, we rely on the account at path 44'/1120'/0'
    // to fingerprint the currently connected device.
    // TODO extract
    const handleResponse = (value: null | LedgerAccount) => {
      const deviceId = value !== null ? value.publicKey.slice(0, 8) : null;
      console.log('deviceId', deviceId);

      runInAction(() => {
        if (deviceId !== this.deviceId) {
          const oldTasks = this.taskQueue;
          this.deviceId = deviceId;
          this.taskQueue = [];
          this.accountCache = {};
          if (value !== null) {
            this.accountCache[PING_ACCOUNT_SLOT] = value;
          }
          this.lastPing = null;
          this.lastSend = null;
          // Cancel the previous tasks after the state has been updated to make
          // sure that the error handlers can see the new deviceId
          oldTasks
            .filter(t => !t.isDone)
            .forEach(t => t.cancel(new LedgerUnreachableError()));
        } else {
          this.lastPing = new Date();
        }
      });
    };

    const task = new LedgerTask(
      null,
      handleResponse,
      // TODO error handler
      reason => {
        console.log(reason);
      },
      // (reason) => handleResponse(null),
      async () => {
        const accountPath = new DposAccount()
          .coinIndex(SupportedCoin.RISE)
          .account(PING_ACCOUNT_SLOT);

        // @ts-ignore wrong d.ts
        const transport = await createTransport();
        if (!transport) {
          return;
        }
        transport.setExchangeTimeout(5000);

        const comm = new DposLedger(transport);
        return (await comm.getPubKey(accountPath)) as LedgerAccount;
      }
    ) as LedgerTask<{}>;

    // Inject the task to the front of the queue
    task.executioner = this;
    this.taskQueue.unshift(task);

    return task;
  }
}

// -------- TODO extract

// Until https://github.com/LedgerHQ/ledgerjs/issues/213 is fixed
const filterInterface = device =>
  ['win32', 'darwin'].includes(process.platform)
    ? device.usagePage === 0xffa0
    : device.interface === 0 || device.interface === -1;

const getDevices = function() {
  const HID = electronRequire('node-hid');
  return HID.devices(0x2c97, 0x0).filter(filterInterface);
};

const createTransportNodeHID = async () => {
  const devicesList = getDevices();
  if (devicesList.length) {
    return await getTransport().open(devicesList[0].path);
  }
};

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
