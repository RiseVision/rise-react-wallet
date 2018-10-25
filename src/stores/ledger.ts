import { observable, runInAction } from 'mobx';
import { BaseTx, ITransaction } from 'dpos-offline';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import { DposLedger, SupportedCoin, LedgerAccount as DposAccount } from 'dpos-ledger-api';

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

class LedgerTask<T> {
  executioner: LedgerTaskRunner;
  private state: 'pending' | 'executing' | 'done' = 'pending';

  constructor(
    readonly channelId: null | number,
    private resolve: (value: T) => void,
    private reject: (reason: Error) => void,
    private runner: () => Promise<T>,
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
  private isOpen = true;

  constructor(private hub: LedgerHub, private channelId: number) {
  }

  get deviceId(): null | string {
    if (!this.isOpen) {
      return null;
    }
    return this.hub.deviceId;
  }

  getAccount(accountSlot: number): Promise<LedgerAccount> {
    if (!this.isOpen) {
      return Promise.reject(new LedgerUnreachableError());
    }
    return this.hub.getAccount(this.channelId, accountSlot);
  }

  confirmAccount(accountSlot: number): Promise<boolean> {
    if (!this.isOpen) {
      return Promise.reject(new LedgerUnreachableError());
    }
    return this.hub.confirmAccount(this.channelId, accountSlot);
  }

  signTransaction(accountSlot: number, unsignedTx: BaseTx): Promise<null | ITransaction> {
    if (!this.isOpen) {
      return Promise.reject(new LedgerUnreachableError());
    }
    return this.hub.signTransaction(this.channelId, accountSlot, unsignedTx);
  }

  close() {
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
 */
class LedgerHub implements LedgerTaskRunner {
  @observable hasBrowserSupport: boolean | null = null;
  @observable deviceId: null | string = null;

  private processIntervalId: null | number = null;
  private lastChannelId = 0;
  private channelCount = 0;
  private lastPing: null | Date = null;
  private lastSend: null | Date = null;

  private accountCache: {
    [slot: number]: LedgerAccount,
  } = {};
  private taskQueue: LedgerTask<{}>[] = [];

  constructor() {
    this.detectBrowserSupport();
  }

  processTasks() {
    const now = new Date();

    const activeTask = this.taskQueue.find(t => t.isExecuting);
    // When a task is running there's nothing left to do for now
    if (activeTask) {
      return;
    }

    // Make sure there's at least 75ms between tasks
    if (this.lastSend !== null && (now.getTime() - this.lastSend.getTime()) < 75) {
      return;
    }

    let task: null | LedgerTask<{}> = null;

    // Every 3 seconds run the ping task ignoring the queued ones
    if (this.lastPing === null || now.getTime() - this.lastPing.getTime() > 3000) {
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
    const shouldAutoProcess = this.channelCount > 0
      || (this.lastSend && now.getTime() - this.lastSend.getTime() < 5000);
    if (shouldAutoProcess && this.processIntervalId === null) {
      this.processIntervalId = window.setInterval(() => this.processTasks(), 1000);
    } else if (!shouldAutoProcess && this.processIntervalId !== null) {
      window.clearInterval(this.processIntervalId);
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
        (value) => {
          this.accountCache[accountSlot] = value;
          resolve(value);
        },
        reject,
        async () => {
          const accountPath = new DposAccount()
            .coinIndex(SupportedCoin.RISE)
            .account(accountSlot);

          // @ts-ignore wrong d.ts
          const transport = await TransportU2F.create();
          transport.setExchangeTimeout(5000);

          const comm = new DposLedger(transport);
          return await comm.getPubKey(accountPath) as LedgerAccount;
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
        const transport = await TransportU2F.create();
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

  signTransaction(channelId: number, accountSlot: number, unsignedTx: BaseTx): Promise<null | ITransaction> {
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
          const transport = await TransportU2F.create();
          const comm = new DposLedger(transport);

          let account = this.accountCache[accountSlot];
          if (!account) {
            transport.setExchangeTimeout(5000);
            account = await comm.getPubKey(accountPath) as LedgerAccount;
          }

          unsignedTx.senderPublicKey = account.publicKey;
          const txBytes = unsignedTx.getBytes(true, true);

          let signedTx: null | ITransaction;
          transport.setExchangeTimeout(30000);
          try {
            unsignedTx.signature = await comm.signTX(accountPath, txBytes, false);
            signedTx = {
              ...unsignedTx.toObj(),
              senderId: account.address,
            };
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
    const isSupported = await TransportU2F.isSupported();

    runInAction(() => {
      this.hasBrowserSupport = isSupported;
    });
  }

  private injectPingTask(): LedgerTask<{}> {
    // We ping the device periodically to see if it's actually connected and to
    // get the connected device id. Since there's no actual API present that would
    // provide us with the device ID, we rely on the account at path 44'/1120'/0'
    // to fingerprint the currently connected device.
    const handleResponse = (value: null | LedgerAccount) => {
      const deviceId = value !== null ? value.publicKey.slice(0, 8) : null;

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
      (reason) => handleResponse(null),
      async () => {
        const accountPath = new DposAccount()
          .coinIndex(SupportedCoin.RISE)
          .account(PING_ACCOUNT_SLOT);

        // @ts-ignore wrong d.ts
        const transport = await TransportU2F.create();
        transport.setExchangeTimeout(5000);

        const comm = new DposLedger(transport);
        return await comm.getPubKey(accountPath) as LedgerAccount;
      }
    ) as LedgerTask<{}>;

    // Inject the task to the front of the queue
    task.executioner = this;
    this.taskQueue.unshift(task);

    return task;
  }
}

export default class LedgerStore {
  private hub = new LedgerHub();

  get hasBrowserSupport() {
    return this.hub.hasBrowserSupport;
  }

  openChannel(): LedgerChannel {
    return this.hub.openChannel();
  }
}
