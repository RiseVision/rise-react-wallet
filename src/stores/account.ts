import * as assert from 'assert';
import { Delegate, TransactionType } from 'dpos-api-wrapper';
import { groupBy } from 'lodash';
import { action, observable, runInAction, computed } from 'mobx';
import * as moment from 'moment-timezone';
import { timestampToUnix } from '../utils/utils';
import { TConfig } from './index';
import {
  TAccount,
  TGroupedTransactions,
  TTransaction,
  TTransactionsResponse
} from './wallet';

export default class AccountStore {
  config: TConfig;

  @observable id: string;
  @observable publicKey: string;
  @observable readOnly: boolean = false;
  // TODO enum
  @observable fiatCurrency: string = 'USD';
  @observable name: string = '';
  @observable pinned: boolean = false;
  @observable loaded: boolean = false;
  @observable balance: number = 0;
  @observable unconfirmedBalance: number = 0;
  @observable secondPublicKey: string | null;
  @observable secondSignature: boolean = false;

  // TODO rename to balanceFiat
  @observable fiatAmount: string | null;
  // object OR not voted OR not loaded
  // TODO represent state and data separately
  @observable votedDelegate?: Delegate | null = undefined;
  // object OR not registered OR not loaded
  // TODO represent state and data separately
  @observable registeredDelegate?: Delegate | null = undefined;
  @observable groupedTransactions = observable.array<TTransaction>();

  constructor(config: TConfig, account: Partial<TAccount>) {
    assert(account.id, 'Account ID is missing');
    this.importData(account);
    this.config = config;
  }

  importData(account: Partial<TAccount>) {
    for (const [name, value] of Object.entries(account)) {
      this[name] = value;
    }
  }
}
