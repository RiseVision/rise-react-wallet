import * as assert from 'assert';
import {
  Delegate,
  rise as dposAPI,
  TransactionType,
} from 'risejs';
import {
  BaseTx,
  ITransaction,
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
  autorun,
  observe,
  IValueWillChange,
  IValueDidChange
} from 'mobx';
import { RouterStore } from 'mobx-router-rise';
import * as lstore from 'store';
import { BaseApiResponse } from 'dpos-api-wrapper/src/types/base';
import { Account as APIAccount } from 'dpos-api-wrapper/src/types/beans';
import { onboardingAddAccountRoute } from '../routes';
import { RawAmount } from '../utils/amounts';
import {
  getTimestamp,
  normalizeAddress,
  TAddressRecord,
  TAddressSource
} from '../utils/utils';
import AccountStore, { AccountType, LoadingState } from './account';
import AddressBookStore from './addressBook';
import LangStore from './lang';
import { TConfig } from './index';
import * as queryString from 'query-string';
import { Transaction } from './transactions';

export default class WalletStore {
  api: string;
  dposAPI: typeof dposAPI;
  delegateCache: DelegateCache;

  // TODO type as not null
  @observable
  fees = observable.map<TFeeTypes, RawAmount>({
    send: RawAmount.fromUnit('0.1'),
    vote: RawAmount.fromUnit('1'),
    secondsignature: RawAmount.fromUnit('5'),
    delegate: RawAmount.fromUnit('25'),
    multisignature: RawAmount.fromUnit('5')
  });
  @observable accounts = observable.map<string, AccountStore>();
  @observable selectedAccount: AccountStore;

  constructor(
    public config: TConfig,
    public router: RouterStore,
    public addressBook: AddressBookStore,
    public lang: LangStore
  ) {
    dposAPI.nodeAddress = config.api_url;
    this.dposAPI = dposAPI;
    this.api = config.api_url;
    // tslint:disable-next-line:no-use-before-declare
    this.delegateCache = new DelegateCache(this.dposAPI);
    const accounts = this.storedAccounts();
    if (!accounts.length) {
      router.goTo(onboardingAddAccountRoute);
      return;
    }
    const lastSelectedID = lstore.get('lastSelectedAccount');
    // login all stored accounts
    for (const account of accounts) {
      // login and merge-in local data
      this.login(account.id, account);
    }
    this.observeSelectedAccount();
    // select the last selected one
    if (this.accounts.has(lastSelectedID)) {
      this.selectAccount(lastSelectedID);
    } else {
      // or the first one
      this.selectAccount([...this.accounts.keys()][0]);
    }
    this.updateFees();
  }

  observeSelectedAccount() {
    observe(
      this,
      'selectedAccount',
      (change: IValueWillChange<AccountStore>) => {
        if (!change.newValue) {
          return;
        }
        lstore.set('lastSelectedAccount', change.newValue.id);
      }
    );
  }

  @action
  // refreshes the fees from the server
  async updateFees() {
    const fees: TFeesResponse = await this.dposAPI.blocks.getFeeSchedule();
    runInAction(() => {
      for (const [fee, value] of Object.entries(fees.fees)) {
        this.fees.set(fee as TFeeTypes, new RawAmount(value));
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
   * @param account
   */
  saveAccount(account: AccountStore) {
    // field of TStoredAccount
    const fields = [
      'id',
      'publicKey',
      'type',
      'hwId',
      'hwSlot',
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
    const res:
      | TAccountResponse
      | TErrorResponse = await this.dposAPI.accounts.getAccount(id);
    if (!res.success) {
      // fake the account
      // @ts-ignore
      res.account = {
        address: id
      };
      // throw new Error((json as TErrorResponse).error);
    }
    return res as TAccountResponse;
  }

  async createPassphraseTx(
    passphrase: string,
    accountID?: string
  ): Promise<CreateSignatureTx> {
    assert(passphrase);
    const account = accountID
      ? (this.accounts.get(accountID) as AccountStore)
      : this.selectedAccount;
    assert(account, 'Account required');
    const wallet2 = new LiskWallet(passphrase, 'R');
    const tx = new CreateSignatureTx({
      signature: { publicKey: wallet2.publicKey }
    });
    tx.set('timestamp', getTimestamp());
    tx.set('fee', this.fees.get('secondsignature')!.toNumber());

    return tx;
  }

  async createSendTx(
    recipientId: string,
    amount: RawAmount,
    accountID?: string
  ): Promise<SendTx> {
    const account = accountID
      ? (this.accounts.get(accountID) as AccountStore)
      : this.selectedAccount;
    assert(account, 'Account required');

    return new SendTx()
      .set('timestamp', getTimestamp())
      .set('fee', this.fees.get('send')!.toNumber())
      .set('amount', amount.toNumber())
      .set('recipientId', recipientId);
  }

  /**
   * @param delegatePublicKey Delegate you want to vote for.
   * @param accountID Optional - the voter's account ID.
   *   Defaults to the currently selected one.
   */
  async createVoteTx(
    delegatePublicKey: string,
    accountID?: string
  ): Promise<VoteTx> {
    const account = accountID
      ? (this.accounts.get(accountID) as AccountStore)
      : this.selectedAccount;
    assert(account, 'Account required');

    // make sure prev vote has been loaded
    if (account.votedDelegateState !== LoadingState.LOADED) {
      await this.loadVotedDelegate(account.id);
    }

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
    return new VoteTx(assets)
      .withFees(this.fees.get('vote')!.toNumber())
      .set('timestamp', getTimestamp())
      .set('recipientId', account.id);
  }

  async createRegisterDelegateTx(
    username: string,
    accountID?: string
  ): Promise<DelegateTx> {
    const account = accountID
      ? (this.accounts.get(accountID) as AccountStore)
      : this.selectedAccount;
    assert(account, 'Account required');

    // make sure prev registration has been loaded
    if (account.registeredDelegateState !== LoadingState.LOADED) {
      await this.loadRegisteredDelegate(account.id);
    }
    // delegate registrations arent mutable
    if (account.registeredDelegate) {
      throw new Error('Already registered as a delegate');
    }

    const assets: IDelegateTxAsset = {
      delegate: {
        publicKey: account.publicKey,
        username
      }
    };
    return new DelegateTx(assets)
      .withFees(this.fees.get('delegate')!.toNumber())
      .set('timestamp', getTimestamp());
  }

  signTransaction(
    unsignedTx: BaseTx,
    mnemonic: string,
    passphrase: string | null = null
  ): ITransaction {
    const wallet = new LiskWallet(mnemonic, 'R');
    return wallet.signTransaction(unsignedTx, this.secondWallet(passphrase));
  }

  async broadcastTransaction(
    signedTx: ITransaction,
    accountID?: string
  ): Promise<TTransactionResult> {
    const account = accountID
      ? (this.accounts.get(accountID) as AccountStore)
      : this.selectedAccount;
    assert(account, 'Account required');

    // refreshed the account's delegate
    if (signedTx.type === new VoteTx().type) {
      runInAction(() => {
        account.votedDelegate = null;
        account.votedDelegateState = LoadingState.NOT_LOADED;
      });
    }

    // @ts-ignore TODO array
    const res = await this.dposAPI.transactions.put(signedTx);
    await this.refreshAccount(account.id);
    return res;
  }

  async searchDelegates(query: string): Promise<Delegate[]> {
    assert(
      query === query.toLowerCase(),
      'Delegate username query must be all lowercase'
    );
    const params = {
      q: query
    };
    const res = await this.dposAPI.delegates.search(params);
    return res.delegates || [];
  }

  /**
   * @returns The name from the address book OR from one of the added accounts
   *   OR null if not found
   */
  idToName(id: string): string {
    const account = this.accounts.get(id);
    if (account) {
      return account.name;
    }
    const addressBookName = this.addressBook.contacts.get(id);
    if (addressBookName) {
      return addressBookName;
    }
    return '';
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
   * TODO bind as an ovserver
   */
  async refreshAccount(...ids: string[]) {
    for (const id of ids) {
      // refresh only already added accounts
      const local = this.storedAccountbyID(id);
      if (!local) {
        continue;
      }
      const data = await this.loadAccount(id);
      const ret = parseAccountReponse(data, local);
      this.accounts.get(id)!.importData(ret);
    }
  }

  /**
   * Loads the currently voted delegate for the specified account.
   *
   * TODO handle errors
   */
  @action
  async loadVotedDelegate(accountID: string) {
    const account = this.accounts.get(accountID) as AccountStore;
    assert(account, `Account ${accountID} doesn't exist`);
    runInAction(() => {
      account.votedDelegateState = LoadingState.LOADING;
    });
    const res = await this.dposAPI.accounts.getDelegates(account.id);
    runInAction(() => {
      account.votedDelegateState = LoadingState.LOADED;
      account.votedDelegate = (res.delegates && res.delegates[0]) || null;
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
      account.registeredDelegateState = LoadingState.LOADING;
    });
    const delegate = await this.delegateCache.get(account.publicKey, {
      reload: true
    });
    runInAction(() => {
      account.registeredDelegateState = LoadingState.LOADED;
      account.registeredDelegate = delegate;
    });
  }

  /**
   *
   * @param id
   * @param local Optional, omitted on the first login.
   * @param select Should the account become the selected one.
   */
  @action
  async login(
    id: string,
    local?: Partial<TAccount>,
    select: boolean = false
  ): Promise<true> {
    if (!id) {
      throw Error('Address required');
    }
    id = normalizeAddress(id);
    if (!id) {
      throw Error('Invalid address');
    }
    const account = new AccountStore(this.config, { id, ...local }, this);
    this.accounts.set(id, account);
    if (select) {
      this.selectAccount(id);
    }
    this.observeAccount(id);
    const res = await this.loadAccount(id);
    account.importData(parseAccountReponse(res, local));
    account.loaded = true;
    return true;
  }

  observeAccount(id: string) {
    const account = this.accounts.get(id) as AccountStore;
    assert(account, `Account ${id} doesn't exist`);
    autorun(reaction => {
      if (!this.accounts.has(id)) {
        return reaction.dispose();
      }
      this.saveAccount(account);
    });
    const calculateFiat = () => {
      if (this.accounts.has(id)) {
        this.calculateFiat(id);
      }
    };
    const balanceChanged = (change: IValueDidChange<RawAmount>) => {
      // skip when already loading
      if (account.recentTransactions.isLoading) {
        return;
      }
      // refresh only when balance changes, but only if downloaded at least once
      if (
        change.oldValue!.toNumber() === change.newValue.toNumber() &&
        account.recentTransactions.fetched
      ) {
        return;
      }
      // refresh only for viewed accounts (don't pre-fetch)
      if (!account.viewed) {
        return;
      }
      calculateFiat();
      // pass async
      account.recentTransactions.load();
    };
    const viewedChanged = () => {
      // skip when already loading
      if (account.recentTransactions.isLoading) {
        return;
      }
      // pass async
      account.recentTransactions.load();
    };
    const disposers: Array<() => void> = [];
    // @ts-ignore issue with mobx d.ts
    disposers.push(observe(account, 'balance', balanceChanged));
    // @ts-ignore issue with mobx d.ts
    disposers.push(observe(account, 'fiatCurrency', calculateFiat));
    // @ts-ignore issue with mobx d.ts
    disposers.push(observe(account, 'viewed', viewedChanged));
    this.accounts.observe(change => {
      // only deletions
      if (change.type !== 'delete') {
        return;
      }
      // only this account
      if (change.name !== id) {
        return;
      }
      // dispose the observers
      let dispose;
      while ((dispose = disposers.pop())) {
        dispose();
      }
    });
  }

  @action
  selectAccount(id: string) {
    const account = this.accounts.get(id);
    if (!account) {
      throw new Error('Unknown account');
    }
    this.selectedAccount = account;
  }

  getAccountByID(accountID: string): AccountStore | null {
    return this.accounts.get(accountID) || null;
  }

  // TODO throttle per account
  @action
  async calculateFiat(accountID: string) {
    const account = this.getAccountByID(accountID) as AccountStore;
    assert(account, `Account ${accountID} not found`);
    account.balanceFiat = null;
    // TODO calculate
    runInAction(() => {
      account.balanceFiat = '~??? ' + account.fiatCurrency;
    });
  }

  async fetchTransactions(
    accountID: string,
    limit: number = 8,
    offset: number = 0
  ): Promise<Transaction[]> {
    const account = this.accounts.get(accountID) as AccountStore;
    assert(account, `Account ${accountID} doesn't exist`);

    // request
    const [recent, unconfirmed] = await Promise.all([
      this.loadTransactions(accountID, {
        limit,
        offset,
        orderBy: 'timestamp:desc',
        recipientId: account.id,
        senderPublicKey: account.publicKey
      }),
      this.loadTransactions(
        accountID,
        {
          limit,
          address: account.id,
          senderPublicKey: account.publicKey
        },
        false
      )
    ]);

    // ignore unconfirmed when paginating
    if (offset) {
      return recent;
    }

    return [...unconfirmed, ...recent];
  }

  async loadTransactionDelegates(tx: Transaction): Promise<Transaction> {
    if (!tx.asset || !tx.asset.votes) {
      return tx;
    }
    tx.votes = await Promise.all(
      tx.asset.votes.map(async vote => {
        const op = vote.startsWith('-') ? 'remove' : 'add';
        const publicKey = vote.substring(1);

        // We assume that the delegate exists since we're dealing with
        // validated transactions. If the node reports that the delegate
        // doesn't exists, we have bigger problems than a null-ref in wallet.
        const delegate = (await this.delegateCache.get(publicKey))!;

        return {
          op,
          delegate
        } as TTransactionVote;
      })
    );
    return tx;
  }

  getRecipientName(type: TransactionType, recipientID: string | undefined) {
    const types = TransactionType;
    switch (type) {
      case types.SEND:
        return this.idToName(recipientID!);
      default:
        return null;
    }
  }

  @action
  registerAccount(mnemonic: string[]) {
    const wallet = new LiskWallet(mnemonic.join(' '), 'R');
    const account = {
      id: wallet.address,
      publicKey: wallet.publicKey,
      type: AccountType.MNEMONIC
    };
    this.login(account.id, account, true);
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
    lstore.remove('contacts');
    this.accounts.clear();
    // @ts-ignore
    this.selectedAccount = null;
    // TODO handle by an observer ???
    this.router.goTo(onboardingAddAccountRoute);
  }

  async loadTransactions(
    accountID: string,
    params: TTransactionsRequest,
    confirmed: boolean = true
  ): Promise<Transaction[]> {
    let res: TTransactionsResponse | TErrorResponse;
    if (confirmed) {
      // @ts-ignore TODO type errors in dposAPI
      res = await this.dposAPI.transactions.getList(params);
      if (!res.success) {
        throw new Error((res as TErrorResponse).error);
      }
    } else if (!params.senderPublicKey) {
      // Unconfirmed transactions require senderPublicKey to be available,
      // so when the account hasn't broadcast it yet, skip this step
      res = {
        success: true,
        count: 0,
        transactions: []
      };
    } else {
      const url = `${
        this.api
      }/api/transactions/unconfirmed?${queryString.stringify(params)}`;
      // TODO switch to dposAPI once it supports params for unconfirmed
      // transactions
      const rawRes = await this.fetch(url);
      res = await rawRes.json();
    }
    if (!res.success) {
      throw new Error((res as TErrorResponse).error);
    }
    const txs = parseTransactionsReponse(this, accountID, res);

    // load votes
    await Promise.all(txs.map(tx => this.loadTransactionDelegates(tx)));

    return txs;
  }

  /**
   * Fetch overload for tests
   */
  async fetch(url: string): Promise<Response> {
    return fetch(url);
  }

  /**
   * Get contacts from all source like the address book, added accounts and
   * delegates.
   *
   * TODO implement delegates
   */
  getContacts(): TAddressRecord[] {
    assert(this.selectedAccount);

    const walletAccounts = [...this.accounts.values()];
    const walletIDs = walletAccounts.map(({ id }) => id);

    const contactRecords: TAddressRecord[] = this.addressBook.asArray
      // Wallet accounts take precedence, should there be a record in the address book
      .filter(({ id }) => walletIDs.indexOf(id) < 0)
      .map(({ id, name }) => ({
        id,
        name,
        source: TAddressSource.ADDRESS_BOOK
      }));

    const walletRecords: TAddressRecord[] = walletAccounts
      .filter(({ id }) => id !== this.selectedAccount.id)
      .map(({ id, name }) => ({
        id,
        // prevent null names
        name: name || '',
        source: TAddressSource.WALLET
      }));

    return [...contactRecords, ...walletRecords];
  }

  async fetchDelegateByID(id: string): Promise<Delegate | null> {
    const account = await this.dposAPI.accounts.getAccount(id);
    if (!account || !account.account.publicKey) {
      return null;
    }
    return await this.delegateCache.get(account.account.publicKey);
  }
}

// TODO use LoadingState
class DelegateCache {
  private cached: {
    [key: string]:
      | {
          state: 'loading';
          promise: Promise<Delegate | null>;
        }
      | {
          state: 'loaded';
          delegate: Delegate | null;
        };
  } = {};

  constructor(private api: typeof dposAPI) {}

  // TODO `opts.reload` -> `force`
  async get(
    publicKey: string,
    opts: { reload?: boolean } = {}
  ): Promise<Delegate | null> {
    const reload = opts.reload !== undefined ? opts.reload : false;

    let entry = this.cached[publicKey];
    if (reload || !entry) {
      const promise = this.fetchAndUpdate(publicKey);
      entry = {
        state: 'loading',
        promise
      };
      this.cached[publicKey] = entry;
    }

    if (entry.state === 'loading') {
      return await entry.promise;
    } else {
      return entry.delegate;
    }
  }

  set(publicKey: string, delegate: Delegate) {
    this.cached[publicKey] = {
      state: 'loaded',
      delegate: delegate
    };
  }

  private async fetchAndUpdate(publicKey: string): Promise<Delegate> {
    const res = await this.api.delegates.getByPublicKey(publicKey);
    const delegate = res.delegate || null;
    this.set(publicKey, delegate);
    return delegate;
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
  const parsed: Partial<TAccount> = {
    id: res.account.address,
    publicKey: res.account.publicKey,
    name: '',
    fiatCurrency: 'USD',
    type: AccountType.READONLY,
    hwId: null,
    hwSlot: null,
    pinned: false,
    secondSignature: Boolean(res.account.secondSignature),
    secondPublicKey: res.account.secondPublicKey,
    // balance: correctAmount(res.account.balance),
    // unconfirmedBalance: correctAmount(res.account.unconfirmedBalance),
    // original data
    balance: new RawAmount(res.account.balance || 0),
    unconfirmedBalance: new RawAmount(res.account.unconfirmedBalance || 0)
  };
  return {
    ...parsed,
    ...local,
    // always take the public key from the server (ex virgin accounts)
    ...(parsed.publicKey ? { publicKey: parsed.publicKey } : {})
  } as TAccount;
}

export function parseTransactionsReponse(
  wallet: WalletStore,
  accountID: string,
  res: TTransactionsResponse
): Transaction[] {
  return res.transactions.map(raw => {
    return new Transaction(wallet, accountID, raw);
  });
}

export type TTransactionResult = {
  success: boolean;
  accepted?: string[];
  invalid?: { id: string; reason: string }[];
};

export type TGroupedTransactions = {
  [group: string]: Transaction[];
};

// TODO get from `risejs` once types complete
export type APITransaction = {
  amount: null | number | string;
  asset: {
    signature?: {};
    votes?: string[];
    delegate?: {
      username: string;
    };
  };
  blockId: string;
  confirmations: number;
  fee: number | string;
  height: number;
  id: string;
  // TODO non-optional for type === SEND
  recipientId?: string;
  recipientPublicKey?: string;
  senderId: string;
  senderPublicKey: string;
  signature: string;
  // TODO
  // tslint:disable-next-line:no-any
  signatures: any[];
  timestamp: number;
  type: TransactionType;
};

export type TTransactionVote = {
  op: 'add' | 'remove';
  delegate: Delegate;
};

export type TTransactionsRequest = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  recipientId?: string;
  senderPublicKey?: string;
  address?: string;
};

export type TTransactionsResponse = {
  count: number;
  success: boolean;
  transactions: APITransaction[];
};

export type TStoredAccount = {
  id: string;
  publicKey: string;
  type: AccountType;
  hwId: null | string;
  hwSlot: null | number;
  fiatCurrency: string;
  name: string;
  pinned: boolean;
};

export type TAccount = TStoredAccount & {
  balance: RawAmount;
  unconfirmedBalance: RawAmount;
  secondPublicKey: string | null;
  secondSignature: boolean;
};

export type TAccountResponse = { account: APIAccount } & BaseApiResponse;

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
