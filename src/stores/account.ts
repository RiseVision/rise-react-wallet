import * as assert from 'assert';
import { Delegate } from 'dpos-api-wrapper';
import { action, observable, runInAction } from 'mobx';
import * as lstore from 'store';
import { TConfig } from './index';
import TransactionsStore from './transactions';
import WalletStore from './wallet';
import { RawAmount } from '../utils/amounts';
import { As } from 'type-tagger';
import { Address, SenderType } from 'dpos-offline';

// TODO rename to ProgressState (NOT_STARTED, STARTED, DONE)
export enum LoadingState {
  NOT_LOADED,
  LOADING,
  LOADED
}

export enum AccountType {
  READONLY,
  MNEMONIC,
  LEDGER
}

type ImportableFields =
  | 'id'
  | 'localId'
  | 'publicKey'
  | 'broadcastedPublicKey'
  | 'type'
  | 'hwId'
  | 'hwSlot'
  | 'fiatCurrency'
  | 'name'
  | 'pinned'
  | 'balance'
  | 'unconfirmedBalance'
  | 'secondPublicKey'
  | 'secondSignature';

export default class AccountStore {
  config: TConfig;

  // account overview has been viewed at least once
  @observable viewed: boolean = false;
  /** account data has been fetched from the server */
  @observable loaded: boolean = false;

  @observable id: string;
  @observable localId: number;
  @observable publicKey: string | null = null;
  @observable broadcastedPublicKey: string | null = null;

  @observable type: AccountType;
  @observable hwId: null | string;
  @observable hwSlot: null | number;

  // TODO enum / config
  @observable fiatCurrency: string = 'USD';
  @observable balance: RawAmount = RawAmount.ZERO;
  @observable unconfirmedBalance: RawAmount = RawAmount.ZERO;
  @observable secondPublicKey: string | null;
  @observable secondSignature: boolean = false;
  // local only fields
  @observable name: string = '';
  @observable pinned: boolean = false;
  // dynamic fields
  @observable balanceFiat: number | null;
  @observable votedDelegate: Delegate | null = null;
  @observable votedDelegateState: LoadingState = LoadingState.NOT_LOADED;
  @observable registeredDelegate: Delegate | null = null;
  @observable registeredDelegateState: LoadingState = LoadingState.NOT_LOADED;

  @observable recentTransactions: TransactionsStore;
  @observable selected: boolean = false;

  protected isDirty_ = false;

  /**
   * Data is potentially dirty and need to be re-downloaded from the server.
   * This happens after being offline.
   */
  set isDirty(value: boolean) {
    if (value) {
      runInAction(() => {
        // mark the recent transactions as dirty
        this.recentTransactions.isDirty = true;
        this.recentTransactions.isLoading = false;
      });
    }
    this.isDirty_ = value;
  }

  get isDirty() {
    return this.isDirty_;
  }

  constructor(
    config: TConfig,
    account: Partial<Pick<AccountStore, ImportableFields>>,
    wallet: WalletStore
  ) {
    assert(account.id, 'Account ID is missing');
    this.importData(account, {
      markAsLoaded: false,
      saveCache: false
    });
    this.config = config;
    this.recentTransactions = new TransactionsStore(
      this.config,
      account.id!,
      wallet
    );
    this.loadCache();
  }

  saveCache() {
    const skipFields = ['recentTransactions', 'selected', 'config', 'isDirty'];
    const data: Partial<AccountStore> = {};
    for (const field in this) {
      if (skipFields.includes(field)) {
        continue;
      }
      if (this[field] instanceof RawAmount) {
        // @ts-ignore
        data[field] = this[field].toNumber();
      } else {
        // @ts-ignore
        data[field] = this[field];
      }
    }
    const cache = lstore.get('cache') || {};
    cache.accounts = cache.accounts || {};
    cache.accounts[this.id] = data;
    lstore.set('cache', cache);
  }

  loadCache() {
    const cache = lstore.get('cache') || {};
    cache.accounts = cache.accounts || {};
    const accountCache = cache.accounts[this.id];
    if (!accountCache) {
      return;
    }

    for (const field in accountCache) {
      if (this[field] instanceof RawAmount) {
        this[field] = new RawAmount(accountCache[field]);
      } else {
        this[field] = accountCache[field];
      }
    }
    this.isDirty = true;
  }

  @action
  importData(
    account: Partial<Pick<AccountStore, ImportableFields>>,
    options?: { saveCache: boolean; markAsLoaded: boolean }
  ) {
    const { markAsLoaded, saveCache } = Object.assign(
      {
        markAsLoaded: true,
        saveCache: true
      },
      options
    );

    for (const [name, value] of Object.entries(account)) {
      this[name] = value;
    }
    if (markAsLoaded) {
      this.loaded = true;
    }
    if (saveCache) {
      this.saveCache();
    }
  }

  toSenderObject(): SenderType {
    const { publicKey } = this;
    if (!publicKey) {
      throw new Error(`Account publicKey field must be set at this point.`);
    }

    return {
      address: this.id as Address,
      publicKey: Buffer.from(publicKey, 'hex') as Buffer & As<'publicKey'>
    };
  }
}
