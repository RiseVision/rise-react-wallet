import * as assert from 'assert';
import { Delegate, dposAPI, TransactionType } from 'dpos-api-wrapper';
import {
  SendTx,
  CreateSignatureTx,
  LiskWallet,
  VoteTx,
  IVoteAsset,
  BaseTx
} from 'dpos-offline';
import { action, observable, runInAction, computed } from 'mobx';
import { TxInfo } from '../components/TxDetailsExpansionPanel';
import {
  getTimestamp,
  normalizeAddress,
  timestampToUnix
} from '../utils/utils';
import { TConfig } from './index';
import * as moment from 'moment-timezone';
import { groupBy, pick } from 'lodash';
import * as lstore from 'store';

export default class WalletStore {
  api: string;
  dposAPI: typeof dposAPI;

  // TODO type as not null
  @observable
  fees = observable.map<TTransactionTypes, number>({
    send: 10000000,
    vote: 100000000,
    secondsignature: 500000000,
    delegate: 2500000000,
    multisignature: 500000000
    // TODO def for dapp
  });
  @observable accounts = observable.array<TAccount>();
  @observable selectedAccount: TAccount | null;
  // TODO maybe keep it for all the accounts as observable.map ?
  @observable fiatAmount: string | null;
  @observable recentTransactions = observable.array<TTransaction>();
  @computed
  get groupedTransactions(): TGroupedTransactions {
    // @ts-ignore
    return this.groupTransactionsByDay(this.recentTransactions);
  }
  @observable votedDelegate?: Delegate | null = undefined;

  constructor(public config: TConfig) {
    dposAPI.nodeAddress = config.api_url;
    this.api = config.api_url;
    this.dposAPI = dposAPI;
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
    this.updateFees();
  }

  @action
  // refreshes the fees from the server
  async updateFees() {
    const fees: TFeesResponse = await this.dposAPI.blocks.getFeeSchedule();
    runInAction(() => {
      for (const [fee, value] of Object.entries(fees.fees)) {
        this.fees.set(fee as TTransactionTypes, value);
      }
    });
  }

  /**
   * Returns the list of stored account IDs.
   */
  storedAccounts(): TStoredAccount[] {
    return lstore.get('accounts') || [];
  }

  storedAccount(id: string): TStoredAccount | null {
    return this.storedAccounts().find(a => a.id === id) || null;
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
    const account = this.selectedAccount!;
    let unsigned = new CreateSignatureTx({
      signature: { publicKey: wallet2.publicKey }
    })
      .set('timestamp', getTimestamp())
      .set('fee', this.fees.get('secondsignature')!);
    const tx = wallet.signTransaction(unsigned);
    const transport = await dposAPI.buildTransport();
    await transport.postTransaction(tx);
    await this.refreshAccount(account.id);
  }

  async sendTransaction(
    recipientId: string,
    amount: number,
    mnemonic: string,
    passphrase: string | null,
    account?: TAccount
  ): Promise<string> {
    if (!account) {
      account = this.selectedAccount!;
    }
    assert(account, 'Account required');
    assert(!account.secondSignature || passphrase, 'Passphrase required');

    const unsigned = new SendTx()
      .set('timestamp', getTimestamp())
      .set('fee', this.fees.get('send')!)
      .set('amount', amount)
      .set('recipientId', recipientId);

    const res = await this.singAndSend(unsigned, mnemonic, passphrase);
    await this.refreshAccount(account.id, recipientId);
    return res.transactionId;
  }

  /**
   *
   * @param delegatePublicKey Delegate you want to vote for.
   * @param mnemonic
   * @param passphrase
   * @param account Optional - the voter account. Defaults to the currently
   *   selected one.
   */
  async voteTransaction(
    delegatePublicKey: string,
    mnemonic: string,
    passphrase: string | null,
    account?: TAccount
  ): Promise<string> {
    if (!account) {
      account = this.selectedAccount!;
    }
    assert(account, 'Account required');
    assert(!account.secondSignature || passphrase, 'Passphrase required');

    const assets: IVoteAsset = {
      votes: ['+' + delegatePublicKey]
    };
    // take down the prev vote
    if (this.votedDelegate) {
      assets.votes.push('-' + this.votedDelegate.publicKey);
    }
    const unsigned = new VoteTx(assets)
      .set('timestamp', getTimestamp())
      .withFees(this.fees.get('vote')!)
      .set('recipientId', account.id);

    const res = await this.singAndSend(unsigned, mnemonic, passphrase);
    await this.refreshAccount(account.id);
    return res.transactionId;
  }

  async singAndSend(
    unsigned: BaseTx,
    mnemonic: string,
    passphrase: string | null
  ): Promise<{ transactionId: string }> {
    const wallet = new LiskWallet(mnemonic, 'R');
    const tx = wallet.signTransaction(unsigned, this.secondWallet(passphrase));
    const transport = await dposAPI.buildTransport();
    return await transport.postTransaction(tx);
  }

  // TODO missing in dposAPI
  async searchDelegates(query: string): Promise<Delegate[]> {
    const params = {
      q: query
    };
    const url = new URL(`${this.api}/api/delegates/search`);
    // @ts-ignore
    url.search = new URLSearchParams(params);
    // @ts-ignore
    const res = await fetch(url);
    const json = await res.json();
    return json.delegates || [];
  }

  /**
   * Second wallet for signing with the second passphrase.
   * @param passphrase
   */
  secondWallet(passphrase: string | null): LiskWallet | undefined {
    return passphrase ? new LiskWallet(passphrase, 'R') : undefined;
  }

  @action
  /**
   * Refreshed the accounts by IDs, but only if added locally.
   * TODO refresh also the recent transactions
   */
  async refreshAccount(...ids: string[]) {
    for (const id of ids) {
      const local = this.storedAccount(id);
      if (!local) {
        continue;
      }
      const ret = parseAccountReponse(await this.loadAccount(id), local);
      const account = this.accounts.find(a => a.id === id);
      runInAction(() => {
        this.accounts.remove(account!);
        this.accounts.push(ret);
      });
    }
  }

  /**
   * Loaded the currently voted delegate for the currently selected account.
   *
   * TODO make it usefull when called directly
   * TODO handle errors
   */
  @action
  async loadVotedDelegate() {
    runInAction(() => {
      this.votedDelegate = undefined;
    });
    assert(this.selectedAccount, 'Selected account required');
    const delegates = await this.dposAPI.accounts.getDelegates(
      this.selectedAccount!.id
    );
    runInAction(() => {
      this.votedDelegate = delegates.delegates ? delegates.delegates[0] : null;
    });
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
  removeAccount(id?: string) {
    if (!id) {
      id = this.selectedAccount!.id;
    }
    const wasSelected = id === this.selectedAccount!.id;
    const account = this.accounts.find(a => a.id === id);
    assert(account, `Account ${id} not found`);
    this.accounts.remove(account!);
    lstore.set('accounts', this.storedAccounts().filter(a => a.id !== id));
    if (wasSelected && this.accounts.length) {
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
            return this.config.date_format;
          }
        });
    });
  }

  // TODO dont depend on this.selectedAccount
  parseTransactionsReponse(res: TTransactionsResponse): TTransaction[] {
    return res.transactions.map(t => {
      t.timestamp = timestampToUnix(t.timestamp);
      t.info =
        t.senderId === this.selectedAccount!.id
          ? {
              kind: 'send',
              recipient_alias: this.idToName(t.recipientId),
              recipient_address: t.recipientId,
              amount: t.amount + t.fee
            }
          : {
              kind: 'receive',
              sender_alias: this.idToName(t.senderId),
              sender_address: t.senderId,
              amount: t.amount
            };
      switch (t.type) {
        case TransactionType.SIGNATURE:
          // TODO fix TxInfo to a unified format
          // @ts-ignore TODO translate 'Second Passphrase'
          t.info.recipient_alias = 'Second Passphrase';
          break;
        case TransactionType.VOTE:
          // TODO fix TxInfo to a unified format
          // @ts-ignore TODO translate 'Cast Vote'
          t.info.recipient_alias = 'Cast Vote';
          break;
        case TransactionType.DELEGATE:
          // TODO fix TxInfo to a unified format
          // @ts-ignore TODO translate 'Register Delegate'
          t.info.recipient_alias = 'Register Delegate';
          break;
        default:
      }
      return t;
    });
  }

  /**
   * @returns The name from the address book OR from one of the added accounts
   *   OR the source ID if not found
   * TODO
   */
  idToName(id: string) {
    for (const account of this.accounts) {
      if (account.id === id && account.name) {
        return account.name;
      }
    }
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
  local?: Partial<TStoredAccount> | null
): TAccount {
  const parsed = {
    id: res.account.address,
    publicKey: res.account.publicKey,
    name: null,
    fiatCurrency: 'USD',
    readOnly: false,
    pinned: false,
    secondSignature: Boolean(res.account.secondSignature),
    secondPublicKey: res.account.secondPublicKey,
    // balance: correctAmount(res.account.balance),
    // unconfirmedBalance: correctAmount(res.account.unconfirmedBalance),
    // original data
    balance: parseInt(res.account.balance, 10),
    unconfirmedBalance: parseInt(res.account.unconfirmedBalance, 10)
  };
  return {
    ...parsed,
    ...local,
    // always take the public key from the server (ex virgin accounts)
    ...{ publicKey: parsed.publicKey }
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
  amount: number;
  asset: { signature?: {} };
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
  type: TransactionType;
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
  fiatCurrency: string;
  pinned: boolean;
  balance: number;
  unconfirmedBalance: number;
  readOnly: boolean;
  secondPublicKey: string | null;
  secondSignature: boolean;
  // _balance: number;
  // _unconfirmedBalance: number;
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

export type TFeesResponse = {
  fees: {
    send: number;
    vote: number;
    secondsignature: number;
    delegate: number;
    multisignature: number;
    dapp: number;
  };
};

export type TTransactionTypes =
  | 'send'
  | 'vote'
  | 'secondsignature'
  | 'delegate'
  | 'multisignature'
  | 'dapp';
