import * as assert from 'assert';
import { Delegate } from 'dpos-api-wrapper';
import { action, observable } from 'mobx';
import { TConfig } from './index';
import TransactionsStore from './transactions';
import WalletStore from './wallet';
import { RawAmount } from '../utils/amounts';
import { As } from 'type-tagger';
import { Address, SenderType } from 'dpos-offline';

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

  constructor(
    config: TConfig,
    account: Partial<Pick<AccountStore, ImportableFields>>,
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
  importData(account: Partial<Pick<AccountStore, ImportableFields>>) {
    for (const [name, value] of Object.entries(account)) {
      this[name] = value;
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
