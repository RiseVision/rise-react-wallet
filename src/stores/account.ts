import * as assert from 'assert';
import { Delegate } from 'dpos-api-wrapper';
import { action, observable } from 'mobx';
import { TConfig } from './index';
import TransactionsStore from './transactions';
import WalletStore, { TAccount } from './wallet';
import { RawAmount } from '../utils/amounts';

export enum LoadingState {
  NOT_LOADED,
  LOADING,
  LOADED
}

export enum AccountType {
  READONLY,
  MNEMONIC,
  LEDGER,
}

export default class AccountStore {
  config: TConfig;

  // account overview has been viewed at least once
  @observable viewed: boolean = false;

  @observable id: string;
  @observable publicKey: string;

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
  @observable loaded: boolean = false;
  // dynamic fields
  @observable balanceFiat: string | null;
  @observable votedDelegate: Delegate | null = null;
  @observable votedDelegateState: LoadingState = LoadingState.NOT_LOADED;
  @observable registeredDelegate: Delegate | null = null;
  @observable registeredDelegateState: LoadingState = LoadingState.NOT_LOADED;

  @observable recentTransactions: TransactionsStore;

  constructor(
    config: TConfig,
    account: Partial<TAccount>,
    wallet: WalletStore
  ) {
    assert(account.id, 'Account ID is missing');
    this.importData(account);
    this.config = config;
    this.recentTransactions = new TransactionsStore(
      this.config,
      account.id!,
      wallet
    );
  }

  @action
  importData(account: Partial<TAccount>) {
    for (const [name, value] of Object.entries(account)) {
      this[name] = value;
    }
  }
}
