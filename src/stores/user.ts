import * as assert from 'assert';
import { LiskWallet } from 'dpos-offline';
import { action, observable, configure, runInAction, computed } from 'mobx';
import { TxInfo } from '../components/TxDetailsExpansionPanel';
import Store, { correctTimestamp, normalizeAddress } from './store';
import * as moment from 'moment-timezone';
import { groupBy } from 'lodash';

// make sure only actions modify the store
configure({ enforceActions: true });

export default class UserStore {
  api: string;

  @observable accounts = observable.array<TAccount>();
  @observable selectedAccount: TAccount | null;
  @observable fiatAmount: string;
  @observable recentTransactions = observable.array<TTransaction>();
  @computed
  get groupedTransactions(): TGroupedTransactions {
    // @ts-ignore
    return this.groupTransitionsByDay(this.recentTransactions);
  }

  constructor(public app: Store) {
    this.api = app.config.api_url;
    const accounts = this.storedAccounts();
    let isSelected = false;
    const lastSelected = localStorage.getItem('lastSelectedAccount');
    for (const account of accounts) {
      // select the first account
      // TODO memorize the last selected account
      const select: boolean =
        (lastSelected && lastSelected === account.id) ||
        (!lastSelected && !isSelected);
      this.login(account.id, select, account.readOnly);
      isSelected = true;
    }
  }

  /**
   * Returns the list of stored account IDs.
   */
  storedAccounts(): TStoredAccount[] {
    return JSON.parse(localStorage.getItem('accounts') || '[]');
  }

  rememberAccount(account: TStoredAccount) {
    let accounts = this.storedAccounts();
    // check for duplicates
    if (!accounts.find(a => a.id === account.id)) {
      accounts.push(account);
      localStorage.setItem('accounts', JSON.stringify(accounts));
    }
  }

  async loadUser(id: string): Promise<TAccountResponse> {
    const res = await fetch(`${this.api}/api/accounts?address=${id}`);
    const json: TAccountResponse | TErrorResponse = await res.json();
    if (!json.success) {
      // fake the account
      // TODO confirm if expected
      // @ts-ignore
      json.account = {
        address: id,
        balance: 0,
        unconfirmedBalance: 0,
        secondPassphrase: '',
        unconfirmedPassphrase: ''
      };
      // throw new Error((json as TErrorResponse).error);
    }
    return json as TAccountResponse;
  }

  @action
  async login(id: string, select: boolean = true, readOnly: boolean = false) {
    if (!id) {
      throw Error('Address required');
    }
    if (!normalizeAddress(id)) {
      throw Error('Invalid address');
    }
    const res = await this.loadUser(id);
    const account = parseAccountReponse(res);
    const accountNamesJSON = localStorage.getItem('accountNames') || '{}';
    const accountNames = JSON.parse(accountNamesJSON);
    if (accountNames[account.id]) {
      account.name = accountNames[account.id];
    }
    // add the acount to the store and mark as selected
    runInAction(() => {
      this.accounts.push(account);
      if (select) {
        this.selectAccount(id);
      }
    });
    this.rememberAccount({ id: id, readOnly });
    return true;
  }

  @action
  selectAccount(id: string) {
    const account = this.accounts.find(a => a.id === id);
    if (!account) {
      throw new Error('Unknown account');
    }
    localStorage.setItem('lastSelectedAccount', id);
    // cleanup
    this.recentTransactions.clear();
    this.fiatAmount = null;
    this.selectedAccount = account;
    this.calculateFiat();
    if (account.publicKey) {
      this.getRecentTransactions();
    }
    // TODO calculate fiat
    // TODO refresh latest transactions
  }

  @action
  async calculateFiat() {
    // TODO calculate
    runInAction(() => {
      // TODO check if the same account is still selected
      this.fiatAmount = '~666.99 ' + this.selectedAccount.fiatCurrency;
    });
  }

  @action
  async getRecentTransactions(amount: number = 8) {
    assert(this.selectedAccount, 'Account not selected');
    const recentPromise = this.loadTransactions({
      limit: amount,
      orderBy: 'timestamp:desc',
      // TODO recipient and sender are the same account?
      recipientId: this.selectedAccount.id,
      senderPublicKey: this.selectedAccount.publicKey
    });
    const unconfirmedPromise = this.loadTransactions(
      {
        address: this.selectedAccount.id,
        senderPublicKey: this.selectedAccount.publicKey
      },
      false
    );
    const [recent, unconfirmed] = await Promise.all([
      recentPromise,
      unconfirmedPromise
    ]);
    runInAction(() => {
      this.recentTransactions.length = 0;
      // @ts-ignore
      this.recentTransactions.push(
        ...this.parseTransactionsReponse(unconfirmed)
      );
      // @ts-ignore
      this.recentTransactions.push(...this.parseTransactionsReponse(recent));
    });
  }

  async registerAccount() {
    // wallet.publicKey
  }

  @action
  updateAccountName(name: string) {
    const accountNamesJSON = localStorage.getItem('accountNames') || '{}';
    const accountNames = JSON.parse(accountNamesJSON);
    this.selectedAccount.name = name;
    accountNames[this.selectedAccount.id] = name;
    localStorage.setItem('accountNames', JSON.stringify(accountNames));
  }

  async loadTransactions(
    params: TTransactionsRequest,
    confirmed: boolean = true
  ): Promise<TTransactionsResponse> {
    const path = confirmed ? '' : '/unconfirmed';
    const url = new URL(`${this.api}/api/transactions${path}`);
    // @ts-ignore
    url.search = new URLSearchParams(params);
    // @ts-ignore
    const res = await fetch(url);
    const json: TTransactionsResponse | TErrorResponse = await res.json();
    if (!json.success) {
      throw new Error((json as TErrorResponse).error);
    }
    return json;
  }

  groupTransitionsByDay(transactions: TTransaction[]): TGroupedTransactions {
    return groupBy(transactions, (transaction: TTransaction) => {
      return moment(transaction.timestamp)
        .startOf('day')
        .calendar(null, {
          // TODO translate those
          lastWeek: '[Last] dddd',
          lastDay: '[Yesterday]',
          sameDay: '[Today]',
          nextDay: '[Tomorrow]',
          nextWeek: 'dddd',
          sameElse: () => {
            return this.app.config.date_format;
          }
        });
    });
  }

  parseTransactionsReponse(res: TTransactionsResponse): TTransaction[] {
    return res.transactions.map(t => {
      t.timestamp = correctTimestamp(t.timestamp);
      t.info =
        t.senderId === this.selectedAccount.id
          ? {
              kind: 'send',
              recipient_alias: this.idToName(t.recipientId),
              recipient_address: t.recipientId,
              amount: t.amount
            }
          : {
              kind: 'receive',
              sender_alias: this.idToName(t.senderId),
              sender_address: t.senderId,
              amount: t.amount
            };
      return t;
    });
  }

  /**
   * @returns The name from the address book OR from one of the added accounts
   *   OR the source ID if not found
   * TODO
   */
  idToName(id: string) {
    return id;
  }
}

export function parseAccountReponse(res: TAccountResponse): TAccount {
  return {
    id: res.account.address,
    publicKey: res.account.publicKey,
    // TODO
    name: '',
    // TODO
    mnemonic: '',
    // TODO
    mnemonic2: '',
    // TODO
    fiatCurrency: 'USD',
    pinned: false,
    balance: parseInt(res.account.balance, 10) / 100000000,
    unconfirmedBalance:
      parseInt(res.account.unconfirmedBalance, 10) / 100000000,
    _balance: parseInt(res.account.balance, 10),
    _unconfirmedBalance: parseInt(res.account.unconfirmedBalance, 10)
  };
}

export type TGroupedTransactions = { [group: string]: TTransaction[] };

export type TStoredAccount = {
  id: string;
  readOnly: boolean;
};

export type TTransaction = {
  info: TxInfo;
  amount: 1;
  asset: {};
  blockId: string;
  confirmations: number;
  fee: number;
  height: number;
  id: string;
  recipientId: string;
  recipientPublicKey: string;
  senderId: string;
  senderPublicKey: string;
  signature: string;
  // TODO
  // tslint:disable-next-line:no-any
  signatures: any[];
  timestamp: number;
  type: boolean;
};

export type TTransactionsRequest = {
  limit?: number;
  orderBy?: string;
  recipientId?: string;
  senderPublicKey?: string;
  address?: string;
};

export type TTransactionsResponse = {
  count: string;
  success: true;
  transactions: TTransaction[];
};

export type TAccount = {
  id: string;
  publicKey: string;
  name: string;
  mnemonic: string;
  mnemonic2: string;
  fiatCurrency: string;
  pinned: boolean;
  balance: number;
  unconfirmedBalance: number;
  _balance: number;
  _unconfirmedBalance: number;
  // voted_delegate: string,
};

export type TAccountResponse = {
  account: {
    address: string;
    balance: string;
    // TODO
    // tslint:disable-next-line:no-any
    multisignatures: any[];
    publicKey: string;
    secondPublicKey: string | null;
    secondSignature: number;
    // TODO
    // tslint:disable-next-line:no-any
    u_multisignatures: any[];
    unconfirmedBalance: string;
    unconfirmedSignature: number;
  };
  success: true;
};

export type TErrorResponse = {
  error: string;
  success: false;
};

export function mnemonicToAddress(mnemonic: string[]) {
  const wallet = new LiskWallet(mnemonic.join(' '), 'R');
  return wallet.address;
}
