import * as assert from 'assert';
import { dposAPI } from 'dpos-api-wrapper';
import { CreateSignatureTx, LiskWallet } from 'dpos-offline';
import { action, observable, configure, runInAction, computed } from 'mobx';
import { TxInfo } from '../components/TxDetailsExpansionPanel';
import Store, {
  unixToTimestamp,
  timestampToUnix,
  normalizeAddress
} from './store';
import * as moment from 'moment-timezone';
import { groupBy, pick } from 'lodash';
import * as lstore from 'store';

// make sure only actions modify the store
configure({ enforceActions: true });

export default class UserStore {
  api: string;
  dopsApi: typeof dposAPI;
  // TODO getFeeSchedule
  // TODO observable
  fees: {
    send: 10000000;
    vote: 100000000;
    secondsignature: 500000000;
    delegate: 2500000000;
    multisignature: 500000000;
  };

  @observable accounts = observable.array<TAccount>();
  @observable selectedAccount: TAccount | null;
  @observable fiatAmount: string | null;
  @observable recentTransactions = observable.array<TTransaction>();
  @computed
  get groupedTransactions(): TGroupedTransactions {
    // @ts-ignore
    return this.groupTransactionsByDay(this.recentTransactions);
  }

  constructor(public app: Store) {
    dposAPI.nodeAddress = app.config.api_url;
    this.api = app.config.api_url;
    this.dopsApi = dposAPI;
    const accounts = this.storedAccounts();
    let isSelected = false;
    const lastSelected = lstore.get('lastSelectedAccount');
    for (const account of accounts) {
      const select: boolean =
        (lastSelected && lastSelected === account.id) ||
        (!lastSelected && !isSelected);
      // login, merge local data and select the last selected one
      this.login(account.id, account, select);
      isSelected = true;
    }
  }

  /**
   * Returns the list of stored account IDs.
   */
  storedAccounts(): TStoredAccount[] {
    return lstore.get('accounts') || [];
  }

  /**
   * Remember the account in local storage.
   * @param account
   */
  saveAccount(account: TStoredAccount) {
    // field of TStoredAccount
    const fields = [
      'id',
      'publicKey',
      'readOnly',
      'fiatCurrency',
      'name',
      'pinned'
    ];
    let stored = this.storedAccounts();
    stored = stored.filter(a => a.id !== account.id);
    // store the account, but only the selected fields
    stored.push(pick(account, fields) as TStoredAccount);
    lstore.set('accounts', stored);
  }

  // TODO switch to dposAPI
  async loadAccount(id: string): Promise<TAccountResponse> {
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

  async addPassphrase(mnemonic: string, passphrase: string) {
    const wallet = new LiskWallet(mnemonic, 'R');
    const wallet2 = new LiskWallet(passphrase, 'R');
    let timestamp = unixToTimestamp(
      moment()
        .utc()
        .unix()
    );
    let unsigned = new CreateSignatureTx({
      signature: { publicKey: wallet2.publicKey }
    })
      .set('timestamp', timestamp)
      .set('fee', this.fees.secondsignature);
    const tx = wallet.signTransaction(unsigned);
    const transport = await dposAPI.buildTransport();
    await transport.postTransaction(tx);
  }

  @action
  async login(
    id: string,
    local?: Partial<TStoredAccount>,
    select: boolean = false
  ) {
    if (!id) {
      throw Error('Address required');
    }
    if (!normalizeAddress(id)) {
      throw Error('Invalid address');
    }
    const res = await this.loadAccount(id);
    const account = parseAccountReponse(res, local);
    runInAction(() => {
      this.accounts.push(account);
      if (select) {
        this.selectAccount(id);
      }
    });
    // memorize the account
    this.saveAccount(account);
    return true;
  }

  @action
  selectFiat(fiat: string, accountId?: string) {
    for (const account of this.accounts) {
      if (!accountId || accountId === account.id) {
        account.fiatCurrency = fiat;
        this.saveAccount(account);
      }
    }
    // clear the calculation for the selected account
    this.fiatAmount = null;
  }

  @action
  selectAccount(id: string) {
    const account = this.accounts.find(a => a.id === id);
    if (!account) {
      throw new Error('Unknown account');
    }
    lstore.set('lastSelectedAccount', id);
    // cleanup
    this.recentTransactions.clear();
    this.selectedAccount = account;
    this.calculateFiat();
    if (account.publicKey) {
      this.getRecentTransactions();
    }
  }

  @action
  async calculateFiat() {
    this.fiatAmount = null;
    // TODO calculate
    runInAction(() => {
      // TODO check if the same account is still selected
      this.fiatAmount = '~666.99 ' + this.selectedAccount!.fiatCurrency;
    });
  }

  @action
  async getRecentTransactions(amount: number = 8) {
    assert(this.selectedAccount, 'Account not selected');
    const recentPromise = this.loadTransactions({
      limit: amount,
      orderBy: 'timestamp:desc',
      // TODO recipient and sender are the same account?
      recipientId: this.selectedAccount!.id,
      senderPublicKey: this.selectedAccount!.publicKey
    });
    const unconfirmedPromise = this.loadTransactions(
      {
        address: this.selectedAccount!.id,
        senderPublicKey: this.selectedAccount!.publicKey
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

  @action
  registerAccount(mnemonic: string[]) {
    const wallet = new LiskWallet(mnemonic.join(' '), 'R');
    const account = {
      id: wallet.address,
      publicKey: wallet.publicKey,
      name: null,
      fiatCurrency: 'USD',
      readOnly: false
    };
    this.login(account.id, account, true);
    return account.id;
  }

  @action
  updateAccountName(name: string) {
    this.selectedAccount!.name = name;
    this.saveAccount(this.selectedAccount!);
  }

  @action
  updateFiat(fiat: string, global: boolean = false) {
    assert(fiat, 'FIAT required');
    if (global) {
      for (const account of this.accounts) {
        account.fiatCurrency = fiat;
        this.saveAccount(account);
      }
    } else {
      this.selectedAccount!.fiatCurrency = fiat;
      this.saveAccount(this.selectedAccount!);
    }
    this.calculateFiat();
  }

  @action
  removeAccount(id: string) {
    this.accounts.remove(this.selectedAccount!);
    lstore.set('accounts', this.storedAccounts().filter(a => a.id !== id));
    if (this.accounts.length) {
      this.selectAccount(this.accounts[0].id);
    }
  }

  // TODO switch to dposAPI
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

  groupTransactionsByDay(transactions: TTransaction[]): TGroupedTransactions {
    // @ts-ignore wrong lodash typing for groupBy
    return groupBy(transactions, (transaction: TTransaction) => {
      return moment(transaction.timestamp)
        .startOf('day')
        .calendar(undefined, {
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
      t.timestamp = timestampToUnix(t.timestamp);
      t.info =
        t.senderId === this.selectedAccount!.id
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

/**
 *
 * @param res Response from the server
 * @param local Local data for the account. Optional.
 */
export function parseAccountReponse(
  res: TAccountResponse,
  local?: Partial<TStoredAccount>
): TAccount {
  const parsed = {
    id: res.account.address,
    publicKey: res.account.publicKey,
    name: null,
    // TODO
    mnemonic: '',
    // TODO
    mnemonic2: '',
    fiatCurrency: 'USD',
    readOnly: false,
    pinned: false,
    balance: parseInt(res.account.balance, 10) / 100000000,
    unconfirmedBalance:
      parseInt(res.account.unconfirmedBalance, 10) / 100000000,
    _balance: parseInt(res.account.balance, 10),
    _unconfirmedBalance: parseInt(res.account.unconfirmedBalance, 10)
  };
  return {
    ...parsed,
    ...local
  };
}

export type TGroupedTransactions = { [group: string]: TTransaction[] };

export type TStoredAccount = {
  id: string;
  publicKey: string;
  readOnly: boolean;
  fiatCurrency: string;
  name: string | null;
  pinned: boolean;
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
  name: string | null;
  mnemonic: string;
  mnemonic2: string;
  fiatCurrency: string;
  pinned: boolean;
  balance: number;
  unconfirmedBalance: number;
  readOnly: boolean;
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
