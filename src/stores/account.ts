import * as assert from 'assert';
import { Delegate } from 'dpos-api-wrapper';
import { action, observable } from 'mobx';
import { TConfig } from './index';
import TransactionsStore from './transactions';
import { TAccount } from './wallet';

export enum LoadingState {
  NOT_LOADED,
  LOADING,
  LOADED
}

export default class AccountStore {
  config: TConfig;

  @observable id: string;
  @observable publicKey: string;
  @observable readOnly: boolean = false;
  // TODO enum / config
  @observable fiatCurrency: string = 'USD';
  @observable balance: number = 0;
  @observable unconfirmedBalance: number = 0;
  @observable secondPublicKey: string | null;
  @observable secondSignature: boolean = false;
  // local only fields
  @observable name: string = '';
  @observable pinned: boolean = false;
  @observable loaded: boolean = false;
  // dynamic fields
  @observable balanceFiat: string | null;
  @observable votedDelegate: Delegate | null = null;
  @observable votedDelegateState: LoadingState = LoadingState.NOT_LOADED;
  @observable registeredDelegate: Delegate | null = null;
  @observable registeredDelegateState: LoadingState = LoadingState.NOT_LOADED;

  @observable recentTransactions: TransactionsStore;

  constructor(config: TConfig, account: Partial<TAccount>) {
    assert(account.id, 'Account ID is missing');
    this.importData(account);
    this.config = config;
    this.recentTransactions = new TransactionsStore(this.config);
  }

  @action
  importData(account: Partial<TAccount>) {
    for (const [name, value] of Object.entries(account)) {
      this[name] = value;
    }
  }
}
