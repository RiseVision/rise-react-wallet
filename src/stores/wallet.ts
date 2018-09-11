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
  autorun,
  observe,
  IValueWillChange
} from 'mobx';
import { RouterStore } from 'mobx-router';
import * as lstore from 'store';
import { BaseApiResponse } from 'dpos-api-wrapper/src/types/base';
import { Account as APIAccount } from 'dpos-api-wrapper/src/types/beans';
import { onboardingAddAccountRoute } from '../routes';
import { RawAmount } from '../utils/amounts';
import {
  getTimestamp,
  normalizeAddress,
  timestampToUnix
} from '../utils/utils';
import AccountStore, { LoadingState } from './account';
import { TConfig } from './index';
import * as moment from 'moment-timezone';

class DelegateCache {
  private cached: {
    [key: string]: {
      state: 'loading';
      promise: Promise<Delegate | null>;
    } | {
      state: 'loaded';
      delegate: Delegate | null;
    };
  } = {};

  constructor(private api: typeof dposAPI) {
  }

  async get(publicKey: string, opts: { reload?: boolean } = {}): Promise<Delegate | null> {
    const reload = opts.reload !== undefined ? opts.reload : false;

    let entry = this.cached[publicKey];
    if (reload || !entry) {
      const promise = this.fetchAndUpdate(publicKey);
      entry = {
        state: 'loading',
        promise,
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
      delegate: delegate,
    };
  }

  private async fetchAndUpdate(publicKey: string): Promise<Delegate> {
    const res = await this.api.delegates.getByPublicKey(publicKey);
    const delegate = res.delegate || null;
    this.set(publicKey, delegate);
    return delegate;
  }
}

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

  constructor(public config: TConfig, public router: RouterStore) {
    dposAPI.nodeAddress = config.api_url;
    this.api = config.api_url;
    this.dposAPI = dposAPI;
    this.delegateCache = new DelegateCache(this.dposAPI);
    const accounts = this.storedAccounts();
    if (!accounts.length) {
      router.goTo(onboardingAddAccountRoute);
      return;
    }
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
    // observe this.selectedAccount
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
    this.updateFees();
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

  async addPassphrase(
    mnemonic: string,
    passphrase: string,
    accountID?: string
  ): Promise<TTransactionResult> {
    assert(mnemonic);
    assert(passphrase);
    const account = accountID
      ? (this.accounts.get(accountID) as AccountStore)
      : this.selectedAccount;
    assert(account, 'Account required');
    const wallet = new LiskWallet(mnemonic, 'R');
    const wallet2 = new LiskWallet(passphrase, 'R');
    let unsigned = new CreateSignatureTx({
      signature: { publicKey: wallet2.publicKey }
    })
      .set('timestamp', getTimestamp())
      .set('fee', this.fees.get('secondsignature')!.toNumber());
    const tx = wallet.signTransaction(unsigned);
    const transport = await dposAPI.buildTransport();
    const ret = await transport.postTransaction(tx);
    await this.refreshAccount(account.id);
    // TODO return also the error msg
    return ret;
  }

  async sendTransaction(
    recipientId: string,
    amount: RawAmount,
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
      .set('fee', this.fees.get('send')!.toNumber())
      .set('amount', amount.toNumber())
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
    const unsigned = new VoteTx(assets)
      .withFees(this.fees.get('vote')!.toNumber())
      .set('timestamp', getTimestamp())
      .set('recipientId', account.id);

    runInAction(() => {
      account.votedDelegate = null;
      account.votedDelegateState = LoadingState.NOT_LOADED;
    });

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
    const unsigned = new DelegateTx(assets)
      .withFees(this.fees.get('delegate')!.toNumber())
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
    assert(
      query === query.toLowerCase(),
      'Delegate username query must be all lowercase'
    );
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
    const delegate = await this.delegateCache.get(account.publicKey, { reload: true });
    runInAction(() => {
      account.registeredDelegateState = LoadingState.LOADED;
      account.registeredDelegate = delegate;
    });
  }

  /**
   *
   * @param id
   * @param local Optional, omitted on the first login.
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
    const account = new AccountStore(this.config, { id, ...local });
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
    const account = this.accounts.get(id);
    assert(account, `Account ${id} doesn't exist`);
    autorun(reaction => {
      if (!this.accounts.has(id)) {
        return reaction.dispose();
      }
      this.saveAccount(account!);
    });
    const calculateFiat = () => {
      if (this.accounts.has(id)) {
        this.calculateFiat(id);
      }
    };
    // @ts-ignore issue with mobx d.ts
    const disposeBalance = observe(account, 'balance', calculateFiat);
    // @ts-ignore issue with mobx d.ts
    const disposeTransactions = observe(account, 'balance', () => {
      this.loadRecentTransactions(id);
    });
    // @ts-ignore issue with mobx d.ts
    const disposeFiat = observe(account, 'fiatCurrency', calculateFiat);
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
      disposeBalance();
      disposeFiat();
      disposeTransactions();
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
      // TODO check if the same account is still selected
      account.balanceFiat = '~??? ' + this.selectedAccount.fiatCurrency;
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
    }).then(tx => this.parseTransactionsReponse(accountID, tx));
    const unconfirmedPromise = this.loadTransactions(
      {
        address: account.id,
        senderPublicKey: account.publicKey
      },
      false
    ).then(tx => this.parseTransactionsReponse(accountID, tx));
    const [recent, unconfirmed] = await Promise.all([
      recentPromise,
      unconfirmedPromise
    ]);
    runInAction(() => {
      account.recentTransactions.items.length = 0;
      account.recentTransactions.items.push(
        ...unconfirmed,
        ...recent,
      );
    });
    return true;
  }

  parseTransactionVotes(votes: string[]): Promise<TTransactionVote[]> {
    return Promise.all(votes.map(async (vote) => {
      const op = vote.startsWith('-') ? 'remove' : 'add';
      const publicKey = vote.substring(1);

      // We assume that the delegate exists since we're dealing with
      // validated transactions. If the node reports that the delegate
      // doesn't exists, we have bigger problems than a null-ref in wallet.
      const delegate = (await this.delegateCache.get(publicKey))!;

      return {
        op,
        delegate,
      } as TTransactionVote;
    }));
  }

  // TODO dont depend on this.selectedAccount
  async parseTransactionsReponse(
    accountID: string,
    res: TTransactionsResponse
  ): Promise<TTransaction[]> {
    let txs = await Promise.all(res.transactions.map(async (raw) => {
      const rawVotes = raw.asset && raw.asset.votes || [];
      return {
        raw,
        votes: await this.parseTransactionVotes(rawVotes),
      };
    }));

    return txs.map(({ raw, votes }) => {
      const amount = new RawAmount(raw.amount || 0);
      const fee = new RawAmount(raw.fee);
      return {
        ...raw,
        timestamp: timestampToUnix(raw.timestamp),
        amount,
        amountFee: amount.plus(fee),
        fee,
        isIncoming: raw.senderId !== accountID,
        senderName: this.idToName(raw.senderId),
        recipientName: this.getRecipientName(raw.type, raw.recipientId),
        time: moment(timestampToUnix(raw.timestamp)).format(
          this.config.date_format
        ),
        votes,
      } as TTransaction;
    });
  }

  getRecipientName(type: TransactionType, recipientID: string) {
    const types = TransactionType;
    switch (type) {
      case types.SEND:
        return this.idToName(recipientID);
      case types.VOTE:
        // TODO translate
        return 'Cast Vote';
      case types.SIGNATURE:
        // TODO translate
        return 'Second Passphrase';
      case types.DELEGATE:
        // TODO translate
        return 'Register Delegate';
      default:
        return null;
    }
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

  async loadTransactions(
    params: TTransactionsRequest,
    confirmed: boolean = true
  ): Promise<TTransactionsResponse> {
    if (confirmed) {
      // @ts-ignore TODO type errors in dposAPI
      const res:
        | TTransactionsResponse
        | TErrorResponse = await this.dposAPI.transactions.getList(params);
      if (!res.success) {
        throw new Error((res as TErrorResponse).error);
      }
      return res;
    } else if (!params.senderPublicKey) {
      // Unconfirmed transactions require senderPublicKey to be available,
      // so when the account hasn't broadcast it yet, skip this step
      return {
        success: true,
        count: 0,
        transactions: []
      };
    } else {
      // TODO switch to dposAPI once it supports params for
      //   unconfirmed transactions
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
    balance: new RawAmount(res.account.balance || 0),
    unconfirmedBalance: new RawAmount(res.account.unconfirmedBalance || 0)
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

type APITransaction = {
  amount: null | number | string;
  asset: {
    signature?: {};
    votes?: string[];
  };
  blockId: string;
  confirmations: number;
  fee: number | string;
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

export type TTransactionVote = {
  op: 'add' | 'remove';
  delegate: Delegate;
};

export type TTransaction = APITransaction & {
  amount: RawAmount;
  amountFee: RawAmount;
  fee: RawAmount;
  isIncoming: boolean;
  senderName: string | null;
  recipientName: string | null;
  time: string;
  votes: TTransactionVote[];
};

export type TTransactionsRequest = {
  limit?: number;
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
  readOnly: boolean;
  fiatCurrency: string;
  name: string | null;
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
