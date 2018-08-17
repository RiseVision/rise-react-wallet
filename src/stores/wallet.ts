import * as assert from 'assert';
import { Delegate, dposAPI, TransactionType } from 'dpos-api-wrapper';
import {
  BaseTx,
  CreateSignatureTx,
  DelegateTx,
  IDelegateTxAsset,
  IVoteAsset,
  LiskWallet,
  SendTx,
  VoteTx
} from 'dpos-offline';
import { pick } from 'lodash';
import {
  action,
  observable,
  runInAction,
  autorun
} from 'mobx';
import { RouterStore } from 'mobx-router';
import * as lstore from 'store';
import { TxInfo } from '../components/TxDetailsExpansionPanel';
import { onboardingAddAccountRoute } from '../routes';
import {
  getTimestamp,
  normalizeAddress,
  timestampToUnix
} from '../utils/utils';
import AccountStore from './account';
import { TConfig } from './index';

export default class WalletStore {
  api: string;
  dposAPI: typeof dposAPI;

  // TODO type as not null
  @observable
  fees = observable.map<TFeeTypes, number>({
    send: 10000000,
    vote: 100000000,
    secondsignature: 500000000,
    delegate: 2500000000,
    multisignature: 500000000
    // TODO def for dapp
  });
  @observable accounts = observable.map<string, AccountStore>();
  @observable selectedAccount: AccountStore;

  constructor(public config: TConfig, public router: RouterStore) {
    dposAPI.nodeAddress = config.api_url;
    this.api = config.api_url;
    this.dposAPI = dposAPI;
    const accounts = this.storedAccounts();
    assert(accounts.length, 'No added accounts');
    const lastSelectedID = lstore.get('lastSelectedAccount');
    // login all stored accounts
    for (const account of accounts) {
      // login, merge local data and select the last selected one
      this.login(account.id, account);
    }
    // select the last selected one
    if (this.accounts.has(lastSelectedID)) {
      this.selectAccount(lastSelectedID);
    } else {
      // or the first one
      this.selectAccount([...this.accounts.keys()][0]);
    }
    this.updateFees();
  }

  @action
  // refreshes the fees from the server
  async updateFees() {
    const fees: TFeesResponse = await this.dposAPI.blocks.getFeeSchedule();
    runInAction(() => {
      for (const [fee, value] of Object.entries(fees.fees)) {
        this.fees.set(fee as TFeeTypes, value);
      }
    });
  }

  /**
   * Returns the list of stored accounts.
   */
  storedAccounts(): TStoredAccount[] {
    return lstore.get('accounts') || [];
  }

  storedAccountbyID(id: string): TStoredAccount | null {
    return this.storedAccounts().find(a => a.id === id) || null;
  }

  /**
   * Remember the account in local storage.
   * TODO bind an an observer
   * @param account
   */
  saveAccount(account: AccountStore) {
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

  protected async loadAccount(id: string): Promise<TAccountResponse> {
    // TODO switch to dposAPI
    const res = await fetch(`${this.api}/api/accounts?address=${id}`);
    const json: TAccountResponse | TErrorResponse = await res.json();
    if (!json.success) {
      // fake the account
      // @ts-ignore
      json.account = {
        address: id
      };
      // throw new Error((json as TErrorResponse).error);
    }
    return json as TAccountResponse;
  }

  async addPassphrase(
    mnemonic: string,
    passphrase: string
  ): Promise<TTransactionResult> {
    const wallet = new LiskWallet(mnemonic, 'R');
    const wallet2 = new LiskWallet(passphrase, 'R');
    const account = this.selectedAccount;
    let unsigned = new CreateSignatureTx({
      signature: { publicKey: wallet2.publicKey }
    })
      .set('timestamp', getTimestamp())
      .set('fee', this.fees.get('secondsignature')!);
    const tx = wallet.signTransaction(unsigned);
    const transport = await dposAPI.buildTransport();
    const ret = await transport.postTransaction(tx);
    await this.refreshAccount(account.id);
    // TODO return also the error msg
    return ret;
  }

  async sendTransaction(
    recipientId: string,
    amount: number,
    mnemonic: string,
    passphrase: string | null,
    accountID?: string
  ): Promise<TTransactionResult> {
    const account = accountID
      ? (this.accounts.get(accountID) as AccountStore)
      : this.selectedAccount;
    assert(account, 'Account required');
    assert(!account.secondSignature || passphrase, 'Passphrase required');

    const unsigned = new SendTx()
      .set('timestamp', getTimestamp())
      .set('fee', this.fees.get('send')!)
      .set('amount', amount)
      .set('recipientId', recipientId);

    const res = await this.singAndSend(unsigned, mnemonic, passphrase);
    await this.refreshAccount(account!.id, recipientId);
    return res;
  }

  /**
   *
   * @param delegatePublicKey Delegate you want to vote for.
   * @param mnemonic
   * @param passphrase
   * @param accountID Optional - the voter's account ID.
   *   Defaults to the currently selected one.
   */
  async voteTransaction(
    delegatePublicKey: string,
    mnemonic: string,
    passphrase: string | null,
    accountID?: string
  ): Promise<TTransactionResult> {
    const account = accountID
      ? (this.accounts.get(accountID) as AccountStore)
      : this.selectedAccount;
    assert(account, 'Account required');
    assert(!account!.secondSignature || passphrase, 'Passphrase required');

    const assets: IVoteAsset = {
      votes: []
    };
    // take down the prev vote
    if (account.votedDelegate) {
      assets.votes.push('-' + account.votedDelegate.publicKey);
    }
    // cast a new vote, if different
    if (
      !account.votedDelegate ||
      account.votedDelegate!.publicKey !== delegatePublicKey
    ) {
      assets.votes.push('+' + delegatePublicKey);
    }
    const unsigned = new VoteTx(assets)
      .withFees(this.fees.get('vote')!)
      .set('timestamp', getTimestamp())
      .set('recipientId', account.id);

    const res = await this.singAndSend(unsigned, mnemonic, passphrase);
    await this.refreshAccount(account.id);
    return res;
  }

  async registerDelegateTransaction(
    username: string,
    mnemonic: string,
    passphrase: string | null,
    accountID?: string
  ): Promise<TTransactionResult> {
    const account = accountID
      ? (this.accounts.get(accountID) as AccountStore)
      : this.selectedAccount;
    assert(account, 'Account required');
    assert(!account.secondSignature || passphrase, 'Passphrase required');

    const assets: IDelegateTxAsset = {
      delegate: {
        publicKey: account.publicKey,
        username
      }
    };
    const unsigned = new DelegateTx(assets)
      .withFees(this.fees.get('delegate')!)
      .set('timestamp', getTimestamp())
      .set('recipientId', account.id);

    const res = await this.singAndSend(unsigned, mnemonic, passphrase);
    await this.refreshAccount(account.id);
    return res;
  }

  async singAndSend(
    unsigned: BaseTx,
    mnemonic: string,
    passphrase: string | null
  ): Promise<TTransactionResult> {
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
   * @returns The name from the address book OR from one of the added accounts
   *   OR null if not found
   */
  idToName(id: string): string | null {
    for (const account of this.accounts.values()) {
      if (account.id === id && account.name) {
        return account.name;
      }
    }
    return null;
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
   * Refreshed specific accounts.
   */
  async refreshAccount(...ids: string[]) {
    for (const id of ids) {
      // refresh only already added accounts
      const local = this.storedAccountbyID(id);
      if (!local) {
        continue;
      }
      // pass await
      this.loadRecentTransactions(id);
      const data = await this.loadAccount(id);
      const ret = parseAccountReponse(data, local);
      this.accounts.get(id)!.importData(ret);
    }
  }

  /**
   * Loads the currently voted delegate for the currently selected account.
   *
   * TODO make it usefull when called directly
   * TODO handle errors
   */
  @action
  async loadVotedDelegate(accountID: string) {
    const account = this.accounts.get(accountID) as AccountStore;
    assert(account, `Account ${accountID} doesn't exist`);
    runInAction(() => {
      // TODO loading states
      account.votedDelegate = undefined;
    });
    assert(this.selectedAccount, 'Selected account required');
    const delegates = await this.dposAPI.accounts.getDelegates(
      this.selectedAccount.id
    );
    runInAction(() => {
      account.votedDelegate = delegates.delegates
        ? delegates.delegates[0]
        : null;
    });
  }

  /**
   * Loads the delegate registration data for the currently selected account.
   *
   * TODO make it usefull when called directly
   * TODO handle errors
   */
  @action
  async loadRegisteredDelegate(accountID: string) {
    const account = this.accounts.get(accountID) as AccountStore;
    assert(account, `Account ${accountID} doesn't exist`);
    runInAction(() => {
      // TODO loading states
      account.registeredDelegate = undefined;
    });
    assert(this.selectedAccount, 'Selected account required');
    const res = await this.dposAPI.delegates.getByPublicKey(
      this.selectedAccount.publicKey
    );
    runInAction(() => {
      account.registeredDelegate = res.delegate ? res.delegate : null;
    });
  }

  /**
   *
   * @param id
   * @param local Optional, omitted on the first login.
   */
  @action
  async login(id: string, local?: Partial<TAccount>): Promise<true> {
    if (!id) {
      throw Error('Address required');
    }
    id = normalizeAddress(id);
    if (!id) {
      throw Error('Invalid address');
    }
    const account = new AccountStore(this.config, { id, ...local });
    this.accounts.set(id, account);
    this.observeAccount(id);
    const res = await this.loadAccount(id);
    account.importData(parseAccountReponse(res, local));
    account.loaded = true;
    return true;
  }

  observeAccount(id: string) {
    const account = this.accounts.get(id);
    assert(account, `Account ${id} doesn't exist`);
    autorun((reaction) => {
      if (!this.accounts.has(id)) {
        return reaction.dispose();
      }
      this.saveAccount(account!);
    });
  }

  @action
  selectAccount(id: string) {
    const account = this.accounts.get(id);
    if (!account) {
      throw new Error('Unknown account');
    }
    this.selectedAccount = account;
    // TODO observer
    this.loadRecentTransactions(id);
    // TODO observe
    lstore.set('lastSelectedAccount', id);
  }

  getAccountByID(accountID: string): AccountStore | null {
    return this.accounts.get(accountID) || null;
  }

  @action
  async calculateFiat(accountID: string) {
    const account = this.getAccountByID(accountID) as AccountStore;
    assert(account, `Account ${accountID} not found`);
    account.fiatAmount = null;
    // TODO calculate
    runInAction(() => {
      // TODO check if the same account is still selected
      account.fiatAmount = '~??? ' + this.selectedAccount.fiatCurrency;
    });
  }

  @action
  async loadRecentTransactions(accountID: string, amount: number = 8) {
    const account = this.accounts.get(accountID) as AccountStore;
    assert(account, `Account ${accountID} doesn't exist`);
    const recentPromise = this.loadTransactions({
      limit: amount,
      orderBy: 'timestamp:desc',
      recipientId: account.id,
      senderPublicKey: account.publicKey
    });
    const unconfirmedPromise = this.loadTransactions(
      {
        address: account.id,
        senderPublicKey: account.publicKey
      },
      false
    );
    const [recent, unconfirmed] = await Promise.all([
      recentPromise,
      unconfirmedPromise
    ]);
    runInAction(() => {
      account.recentTransactions.items.length = 0;
      account.recentTransactions.items.push(
        ...this.parseTransactionsReponse(unconfirmed),
        ...this.parseTransactionsReponse(recent)
      );
    });
    return true;
  }

  // TODO dont depend on this.selectedAccount
  parseTransactionsReponse(res: TTransactionsResponse): TTransaction[] {
    return res.transactions.map(t => {
      t.timestamp = timestampToUnix(t.timestamp);
      t.info =
        t.senderId === this.selectedAccount.id
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

  @action
  registerAccount(mnemonic: string[]) {
    const wallet = new LiskWallet(mnemonic.join(' '), 'R');
    const account = {
      id: wallet.address,
      publicKey: wallet.publicKey
    };
    this.login(account.id, account).then(() => {
      this.selectedAccount = this.accounts.get(account.id) as AccountStore;
    });
    return account.id;
  }

  @action
  removeAccount(id: string) {
    const wasSelected = id === this.selectedAccount.id;
    const account = this.accounts.get(id);
    assert(account, `Account ${id} not found`);
    this.accounts.delete(id);
    // TODO observer
    lstore.set('accounts', this.storedAccounts().filter(a => a.id !== id));
    // select a first account if case the removed one was selected
    const ids = [...this.accounts.keys()];
    if (wasSelected && ids.length) {
      this.selectAccount(ids[0]);
    } else {
      // TODO handle by an observer ???
      this.router.goTo(onboardingAddAccountRoute);
    }
  }

  @action
  signout() {
    lstore.remove('accounts');
    lstore.remove('lastSelectedAccount');
    this.accounts.clear();
    // @ts-ignore
    this.selectedAccount = null;
    // TODO handle by an observer ???
    this.router.goTo(onboardingAddAccountRoute);
  }

  // TODO switch to dposAPI
  async loadTransactions(
    params: TTransactionsRequest,
    confirmed: boolean = true
  ): Promise<TTransactionsResponse> {
    // skip when no public key
    if (params.senderPublicKey === undefined && !params.senderPublicKey) {
      return {
        success: true,
        count: '0',
        transactions: []
      };
    }
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
    balance: parseInt(res.account.balance, 10) || 0,
    unconfirmedBalance: parseInt(res.account.unconfirmedBalance, 10) || 0
  };
  return {
    ...parsed,
    ...local,
    // always take the public key from the server (ex virgin accounts)
    ...(parsed.publicKey ? { publicKey: parsed.publicKey } : {})
  };
}

export type TTransactionResult = {
  transactionId?: string;
  success: boolean;
};

export type TGroupedTransactions = {
  [group: string]: TTransaction[];
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

export type TStoredAccount = {
  id: string;
  publicKey: string;
  readOnly: boolean;
  fiatCurrency: string;
  name: string | null;
  pinned: boolean;
};

export type TAccount = TStoredAccount & {
  balance: number;
  unconfirmedBalance: number;
  secondPublicKey: string | null;
  secondSignature: boolean;
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

// TODO reuse TransactionType from 'dpos-wallet' if possible
export type TFeeTypes =
  | 'send'
  | 'vote'
  | 'secondsignature'
  | 'delegate'
  | 'multisignature'
  | 'dapp';
