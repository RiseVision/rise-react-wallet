import assert from 'assert';
import {
  RiseV2Transaction as GenericRiseTransaction,
  PostableRiseV2Transaction as GenericPostableRiseTransaction,
  RecipientId,
  RiseV2 as Rise
} from 'dpos-offline';
import { isMobile } from 'is-mobile';
import { get, pick } from 'lodash';
import {
  action,
  autorun,
  IValueWillChange,
  observable,
  observe,
  runInAction
} from 'mobx';
import { RouterStore } from 'mobx-router-rise';
import moment, { Moment } from 'moment';
import queryString from 'query-string';
import { BaseApiResponse } from 'risejs/dist/es5/types/base';
import {
  Account as APIAccount,
  TransactionType,
  Delegate
} from 'risejs/dist/es5/types/beans';
// import { Rise as dposAPI, RiseAPIWrapper as APIWrapper } from 'risejs';
import { Rise as dposAPI, RiseAPIWrapper as APIWrapper } from 'risejs/src';
import io from 'socket.io-client';
import { As } from 'type-tagger';
import { onboardingAddAccountRoute } from '../routes';
import { RawAmount } from '../utils/amounts';
import lstore from '../utils/store';
import {
  normalizeAddress,
  TAddressRecord,
  TAddressSource,
  isMainnet,
  timestampToUnix,
  FullDelegate
} from '../utils/utils';
import AccountStore, { AccountType, LoadingState } from './account';
import AddressBookStore from './addressBook';
import { TConfig } from './index';
import LangStore from './lang';
import { Transaction } from './transactions';

export type NetworkType = 'mainnet' | 'testnet' | 'custom';

// TODO move to /utils/utils.ts
// TODO proper type instead of any
// tslint:disable-next-line:no-any
export type RiseTransaction<T = any> = GenericRiseTransaction<T>;
// tslint:disable-next-line:no-any
export type PostableRiseTransaction<T = any> = GenericPostableRiseTransaction<
  T
>;

function nextAccountLocalId(): number {
  const accountId = lstore.get('nextAccountId') || 1;
  lstore.set('nextAccountId', accountId + 1);
  return accountId;
}

export default class WalletStore {
  dposAPI: APIWrapper;
  delegateCache: DelegateCache;
  io: SocketIOClient.Socket | null;

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

  @observable
  suggestedDelegates: Array<FullDelegate> = [];
  suggestedDelegatesTime: Moment | null = null;
  suggestedDelegatesPromise: Promise<Delegate[]> | null;

  fiatPrices: { [currency: string]: number } = {};
  @observable connected: LoadingState = LoadingState.NOT_LOADED;
  @observable isHomeScreen: boolean = false;
  @observable isMobile: boolean = false;
  /** Add to Home Screen event, used to trigger a deferred installation */
  @observable deferredA2HSPrompt: BeforeInstallPromptEvent | null = null;
  @observable supportsA2HS: boolean = false;

  /**
   * Returns node's URL, depending on the current location.
   *
   * Rules:
   * - if on the deployment domain (config), and `wallet` sub-domain
   *   goes to mainnet
   * - anything else goes to testnet
   */
  get nodeAddress() {
    const { url = null } = lstore.get('network') || {};
    switch (this.getNetwork()) {
      case 'mainnet':
        return this.config.api_url;
      case 'testnet':
        return this.config.api_url_testnet;
      case 'custom':
        return url;
      default:
        // auto detect based on the domain name
        if (isMainnet(this.config.domain)) {
          return this.config.api_url;
        }
        return this.config.api_url_testnet;
    }
  }

  constructor(
    public config: TConfig,
    public router: RouterStore,
    public addressBook: AddressBookStore,
    public lang: LangStore
  ) {
    this.config = config;
    this.reload();
    this.observeSelectedAccount();
    // ignore exceptions for unit tests
    try {
      this.detectMobile();
    } catch {}
    if (!this.storedAccounts().length) {
      router.goTo(onboardingAddAccountRoute);
      return;
    }
  }

  @action
  detectMobile() {
    // skip detection for carlo
    if (typeof carlo !== 'undefined') {
      return;
    }
    // https://developers.google.com/web/fundamentals/app-install-banners/
    window.addEventListener(
      'beforeinstallprompt',
      (e: BeforeInstallPromptEvent) => {
        // prevent showing the info bar
        e.preventDefault();
        runInAction(() => {
          this.deferredA2HSPrompt = e;
          this.supportsA2HS = true;
        });
      }
    );

    this.isMobile = isMobile();
    this.isHomeScreen =
      // @ts-ignore missing d.ts
      Boolean(window.navigator.standalone) ||
      window.matchMedia('(display-mode: standalone)').matches;
  }

  /**
   * Install the app using Add to Home Screen API.
   *
   * https://developers.google.com/web/fundamentals/app-install-banners/
   */
  async installA2HS() {
    const prompt = this.deferredA2HSPrompt;
    if (!prompt) {
      return false;
    }
    // Show the prompt
    prompt.prompt();
    // Wait for the user to respond to the prompt
    const choiceResult = await prompt.userChoice;

    // dispose
    runInAction(() => {
      this.deferredA2HSPrompt = null;
    });

    return choiceResult.outcome === 'accepted';
  }

  connect() {
    // pass async
    this.updateFees();
    this.connectSocket();
    // pass async
    this.fetchFiatData();
  }

  /**
   * Perform a full reload of the wallet, including:
   * - accounts
   * - websocket connections
   * - dpos config
   * - delegate cache
   */
  reload() {
    const storedAccount = this.storedAccounts();
    // dispose
    if (this.io) {
      this.io.disconnect();
      this.io = null;
    }
    // init the API
    this.dposAPI = dposAPI.newWrapper(this.nodeAddress);
    // tslint:disable-next-line:no-use-before-declare
    this.delegateCache = new DelegateCache(this.dposAPI);

    // only when there's added accounts
    if (!storedAccount.length) {
      return;
    }
    // clear added accounts
    this.accounts.clear();
    const lastSelectedID = lstore.get('lastSelectedAccount');
    // login all stored accounts
    for (const account of storedAccount) {
      // login and merge-in local data
      this.login(account.id, account);
    }
    // select the last selected one
    if (this.accounts.has(lastSelectedID)) {
      this.selectAccount(lastSelectedID);
    } else {
      // or the first one
      this.selectAccount([...this.accounts.keys()][0]);
    }
  }

  setNetwork(type: NetworkType, url?: string) {
    // remember the choice
    lstore.set('network', { type, url });
    // invalidate cache
    lstore.remove('cache');
    this.reload();
  }

  getNetwork(): NetworkType {
    const { type = null } = lstore.get('network') || {};
    switch (type as NetworkType) {
      case null:
        // auto detect based on the domain name
        if (isMainnet(this.config.domain)) {
          return 'mainnet';
        }
        return 'testnet';
      default:
        return type;
    }
  }

  /**
   * Network ID required for the `transform()` method.
   */
  getTxNetwork(): 'main' | 'test' {
    return this.getNetwork() === 'mainnet' ? 'main' : 'test';
  }

  @action
  setConnected(status: LoadingState) {
    this.connected = status;
  }

  connectSocket() {
    if (this.io) {
      return;
    }
    this.io = io.connect(this.nodeAddress);
    this.io.on('connect', this.setConnected.bind(this, LoadingState.LOADED));
    this.io.on('connecting', () => {
      if (navigator.onLine) {
        this.setConnected(LoadingState.LOADING);
      }
    });
    this.io.on('reconnecting', () => {
      if (navigator.onLine) {
        this.setConnected(LoadingState.LOADING);
      }
    });
    this.io.on(
      'disconnect',
      this.setConnected.bind(this, LoadingState.NOT_LOADED)
    );
    this.io.on('error', this.setConnected.bind(this, LoadingState.NOT_LOADED));
    // react to browser events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.io.connect.bind(this.io));
      window.addEventListener('offline', this.io.disconnect.bind(this.io));
    }
    // TODO get types from rise-node
    type TBlocksChange = { transactions: APITransaction[] };
    // update all accounts involved in the listed transactions
    this.io.on('blocks/change', (change: TBlocksChange) => {
      for (const tx of change.transactions) {
        // pass async
        this.refreshAccount(tx.senderId);
        this.refreshTransaction(tx, tx.senderId);
        // pass async
        if (tx.recipientId) {
          this.refreshAccount(tx.recipientId);
          this.refreshTransaction(tx, tx.recipientId);
        }
      }
    });
    // possible delegates ranking change
    this.io.on('rounds/change', () => {
      // invalidate delegates details
      this.delegateCache.clear();
      // invalidate suggested delegates list
      this.suggestedDelegatesTime = null;
    });
    // new unconfirmed transactions
    this.io.on(
      'transactions/change',
      (tx: APITransaction | APIUncofirmedTransaction) => {
        this.refreshTransaction(tx, tx.senderId);
      }
    );
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
    const fees: TFeesResponse = await this.dposAPI.blocks.fees();
    runInAction(() => {
      for (const [fee, value] of Object.entries(fees.fees)) {
        this.fees.set(fee as TFeeTypes, new RawAmount(value));
      }
    });
  }

  async checkNodesNethash(nodeURL: string): Promise<string> {
    const url = `${nodeURL}/api/transactions/unconfirmed`;
    const rawRes = await this.fetch(url);
    return await rawRes.json();
  }

  /**
   * Returns the list of stored accounts.
   */
  storedAccounts(): TStoredAccount[] {
    return lstore.get('accounts') || [];
  }

  storedAccountByID(id: string): TStoredAccount | null {
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
      'localId',
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

  protected async fetchAccountData(id: string): Promise<TAccountResponse> {
    // const res:
    //   | TAccountResponse
    //   | TErrorResponse = await this.dposAPI.accounts.getAccount(id);
    const res = await this.dposAPI.accounts.getAccount(id);
    if (!res.success) {
      // fake the account
      // @ts-ignore
      res.account = {
        address: id
      };
      // throw new Error((json as TErrorResponse).error);
    }
    return res;
  }

  async createPassphraseTx(
    passphrase: string,
    accountID?: string
  ): Promise<RiseTransaction> {
    assert(passphrase);
    const account = accountID
      ? (this.accounts.get(accountID) as AccountStore)
      : this.selectedAccount;
    assert(account, 'Account required');
    const wallet2 = Rise.deriveKeypair(passphrase);

    // TODO fix types in dpos-offline
    return Rise.txs.transform(
      {
        kind: 'second-signature',
        // @ts-ignore TODO
        publicKey: wallet2.publicKey,
        sender: account.toSenderObject()
      },
      this.getTxNetwork()
    );
  }

  async createSendTx(
    recipientId: string,
    amount: RawAmount,
    accountID?: string
  ): Promise<RiseTransaction> {
    const account = accountID
      ? (this.accounts.get(accountID) as AccountStore)
      : this.selectedAccount;
    assert(account, 'Account required');

    return Rise.txs.transform(
      {
        kind: 'send',
        amount: amount.toString(),
        recipient: recipientId as RecipientId,
        sender: account.toSenderObject()
      },
      this.getTxNetwork()
    );
  }

  /**
   * @param delegateUsername The delegate username you want to vote for.
   * @param accountID Optional - the voter's account ID.
   *   Defaults to the currently selected one.
   */
  async createVoteTx(
    delegateUsername: string,
    accountID?: string
  ): Promise<RiseTransaction> {
    const account = accountID
      ? (this.accounts.get(accountID) as AccountStore)
      : this.selectedAccount;
    assert(account, 'Account required');

    // make sure prev vote has been loaded
    if (account.votedDelegateState !== LoadingState.LOADED) {
      await this.loadVotedDelegate(account.id);
    }

    // Create transaction that removes prev voted delegate (if available)
    // and votes for the new delegate.
    return Rise.txs.transform(
      {
        kind: 'vote',
        sender: account.toSenderObject(),
        preferences: [
          ...(account.votedDelegate
            ? [
                {
                  action: '-' as '-',
                  delegateIdentifier: account.votedDelegate.username
                }
              ]
            : []),
          ...(!account.votedDelegate || account.votedDelegate!.username
            ? [
                {
                  action: '+' as '+',
                  delegateIdentifier: delegateUsername
                }
              ]
            : [])
        ]
      },
      this.getTxNetwork()
    );
  }

  async createRegisterDelegateTx(
    username: string,
    accountID?: string
  ): Promise<RiseTransaction> {
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

    // TODO fix types in dpos-offline
    return Rise.txs.transform(
      {
        kind: 'register-delegate',
        sender: account.toSenderObject(),
        // @ts-ignore TODO
        identifier: username as string & As<'delegateName'>
      },
      this.getTxNetwork()
    );
  }

  signTransaction(
    unsignedTx: RiseTransaction,
    mnemonic: string,
    passphrase: string | null = null
  ): PostableRiseTransaction {
    const signedTx = Rise.txs.sign(unsignedTx, mnemonic);
    // TODO check if correct
    if (passphrase) {
      Rise.txs.sign(signedTx, passphrase);
    }
    return Rise.txs.toPostable(signedTx);
  }

  async broadcastTransaction(
    signedTx: PostableRiseTransaction,
    accountID?: string
  ): Promise<TTransactionResult> {
    const account = accountID
      ? (this.accounts.get(accountID) as AccountStore)
      : this.selectedAccount;
    assert(account, 'Account required');

    // refreshed the account's delegate
    if (signedTx.type === 3 /* vote */) {
      runInAction(() => {
        account.votedDelegate = null;
        account.votedDelegateState = LoadingState.NOT_LOADED;
      });
    }

    const res = await this.dposAPI.transactions.postSingle(signedTx);
    await this.refreshAccount(account.id);
    return res;
  }

  async searchDelegates(
    query: string
  ): Promise<
    Array<
      FullDelegate>
  > {
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

  @action
  /**
   * Refreshed specific accounts.
   * TODO bind as an ovserver
   */
  async refreshAccount(...ids: string[]) {
    for (const id of ids) {
      // refresh only already added accounts
      const local = this.storedAccountByID(id);
      if (!local) {
        continue;
      }
      const data = await this.fetchAccountData(id);
      const ret = parseAccountReponse(data, local);
      this.accounts.get(id)!.importData(ret);
    }
  }

  @action
  refreshTransaction(
    raw: APITransaction | APIUncofirmedTransaction,
    accountID: string
  ) {
    // clone
    const parsed = Object.create(raw);
    parsed.timestamp = timestampToUnix(parsed.timestamp);
    const account = this.accounts.get(accountID);
    if (!account) {
      return;
    }
    const items = account.recentTransactions.items;
    const tx = new Transaction(this, account.id, parsed);
    const i = items.findIndex(t => t.id === tx.id);
    // replace of add (for unconfirmed)
    if (i !== -1) {
      items[i] = tx;
    } else {
      items.push(tx);
    }
  }

  /**
   * Loads the currently voted delegate for the specified account.
   *
   * TODO handle errors
   * TODO concurrency mutex
   */
  @action
  async loadVotedDelegate(accountID: string) {
    const account = this.accounts.get(accountID) as AccountStore;
    assert(account, `Account ${accountID} doesn't exist`);
    // check if already loading
    if (account.votedDelegateState === LoadingState.LOADING) {
      return;
    }
    runInAction(() => {
      account.votedDelegateState = LoadingState.LOADING;
    });
    const res = await this.dposAPI.accounts.getVotes(account.id);
    const delegateName = (res.votes && res.votes[0]) || null;
    const delegateRes =
      res.votes && res.votes[0]
        ? await this.dposAPI.delegates.byUsername(delegateName)
        : null;
    runInAction(() => {
      account.votedDelegateState = LoadingState.LOADED;
      account.votedDelegate = (delegateRes && delegateRes.delegate) || null;
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
    let delegate: Delegate | null = null;
    if (account.publicKey) {
      delegate = await this.delegateCache.get(account.publicKey, {
        reload: true
      });
    }
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
    local: Partial<TAccount> = {},
    select: boolean = false
  ): Promise<true> {
    if (!id) {
      throw Error('Address required');
    }
    id = normalizeAddress(id);
    if (!id) {
      throw Error('Invalid address');
    }
    if (!local.localId) {
      local.localId = nextAccountLocalId();
    }
    const account = new AccountStore(this.config, { id, ...local }, this);
    // connect on the first account
    if (!this.accounts.size) {
      this.connect();
    }
    this.accounts.set(id, account);
    if (select) {
      this.selectAccount(id);
    }
    this.observeAccount(id);
    const res = await this.fetchAccountData(id);
    account.importData(parseAccountReponse(res, local));
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
    // TODO extract
    const refreshRecentTransactions = () => {
      // refresh only for the visible account (dont pre-fetch)
      // and with already downloaded publicKey
      if (!account.visible) {
        return;
      }
      // when coming from offline OR for the first time
      const recent = account.recentTransactions;
      if (recent.fetched && !recent.isDirty) {
        return;
      }
      // skip when already loading
      if (account.recentTransactions.isLoading) {
        return;
      }
      // pass async
      account.recentTransactions.load();
    };
    const disposers: Array<() => void> = [];
    disposers.push(observe(account, 'balance', calculateFiat));
    disposers.push(observe(account, 'fiatCurrency', calculateFiat));
    disposers.push(observe(account, 'visible', refreshRecentTransactions));
    disposers.push(observe(account, 'loaded', refreshRecentTransactions));
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
    // mark as dirty when offline
    if (typeof window !== 'undefined') {
      // TODO dispose listeners
      window.addEventListener('offline', () => {
        account.isDirty = true;
      });
      window.addEventListener('online', () => {
        this.refreshAccount(account.id);
        // refresh transactions only for viewed accounts
        refreshRecentTransactions();
      });
    }
  }

  @action
  selectAccount(id: string) {
    const account = this.accounts.get(id);
    if (!account) {
      // throw new Error('Unknown account');
      return;
    }
    if (this.selectedAccount) {
      this.selectedAccount.selected = false;
    }
    this.selectedAccount = account;
    account.selected = true;
  }

  getAccountByID(accountID: string): AccountStore | null {
    return this.accounts.get(accountID) || null;
  }

  // TODO throttle per account
  @action
  calculateFiat(accountID: string) {
    const account = this.getAccountByID(accountID) as AccountStore;
    assert(account, `Account ${accountID} not found`);
    const rate = this.fiatPrices[account.fiatCurrency.toLowerCase()];
    // handle if no conversion rate was provided
    if (!rate) {
      account.balanceFiat = null;
      return;
    }
    account.balanceFiat = account.balance.unit.toNumber() * rate;
  }

  /** Fetches conversion rates from coingecko.com */
  async fetchFiatData() {
    const ret = await fetch(
      `https://api.coingecko.com/api/v3/coins/rise?
      localization=false&tickers=false&market_data=true&community_data=false&
      developer_data=false&sparkline=false`.replace(/\s+/g, '')
    );
    const json = await ret.json();
    this.fiatPrices = json.market_data.current_price;
    // recalculate values for all accounts
    for (const id of this.accounts.keys()) {
      this.calculateFiat(id);
    }
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
        senderPubData: account.publicKey || undefined
      }),
      this.loadTransactions(
        accountID,
        {
          limit,
          address: account.id,
          senderPubData: account.publicKey || undefined
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
    const wallet = Rise.deriveKeypair(mnemonic.join(' '));

    const account = {
      // TODO check v0
      id: Rise.calcAddress(wallet.publicKey, this.getTxNetwork(), 'v0'),
      publicKey: wallet.publicKey.toString('hex'),
      type: AccountType.MNEMONIC
    };
    // pass async
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
    // TODO remove accounts cache
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
    lstore.remove('network');
    lstore.remove('accounts');
    lstore.remove('lastSelectedAccount');
    lstore.remove('contacts');
    lstore.remove('cache');
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
      res = await this.dposAPI.transactions.list(params);
      if (!res.success) {
        // @ts-ignore
        throw new Error((res as TErrorResponse).error);
      }
    } else if (!params.senderPubData) {
      // Unconfirmed transactions require senderPubData to be available,
      // so when the account hasn't broadcast it yet, skip this step
      res = {
        success: true,
        count: 0,
        transactions: []
      };
    } else {
      const url = `${
        this.nodeAddress
      }/api/transactions/unconfirmed?${queryString.stringify(params)}`;
      // TODO switch to dposAPI once it supports params for unconfirmed
      // transactions
      const rawRes = await this.fetch(url);
      res = await rawRes.json();
    }
    if (!res.success) {
      throw new Error((res as TErrorResponse).error);
    }
    const txs = parseTransactionsResponse(this, accountID, res);

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

  async fetchDelegateByID(
    id: string
  ): Promise<
    | FullDelegate| null
  > {
    const res = await this.dposAPI.accounts.getAccount(id);
    const publicKey = get(res, 'account.forgingPK');
    if (!publicKey) {
      return null;
    }
    return await this.delegateCache.get(publicKey);
  }

  async fetchSuggestedDelegates(): Promise<Delegate[]> {
    // mutex (usage)
    if (this.suggestedDelegatesPromise) {
      await this.suggestedDelegatesPromise;
      return this.suggestedDelegates;
    }
    const timeout = this.config.suggested_delegates_cache_sec;
    const expired =
      !this.suggestedDelegatesTime ||
      this.suggestedDelegatesTime
        .add(timeout, 'seconds')
        .isBefore(moment().utc());
    if (expired) {
      // mutex (init)
      this.suggestedDelegatesPromise = new Promise(async (resolve, reject) => {
        try {
          const res = await this.dposAPI.delegates.list();
          // update the observable
          runInAction(() => {
            this.suggestedDelegates = res.delegates || [];
          });
          resolve(this.suggestedDelegates);
        } catch (e) {
          reject(e);
        }
      });
      try {
        await this.suggestedDelegatesPromise;
        this.suggestedDelegatesTime = moment().utc();
      } finally {
        this.suggestedDelegatesPromise = null;
      }
    }
    return this.suggestedDelegates;
  }
}

// TODO use LoadingState
class DelegateCache {
  private cached: {
    [key: string]:
      | {
          state: 'loading';
          promise: Promise<FullDelegate | null>;
        }
      | {
          state: 'loaded';
          delegate: FullDelegate | null;
        };
  } = {};

  constructor(private api: APIWrapper) {}

  // TODO `opts.reload` -> `force`
  async get(
    publicKey: string,
    opts: { reload?: boolean } = {}
  ): Promise<FullDelegate | null> {
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

  set(publicKey: string, delegate: FullDelegate) {
    this.cached[publicKey] = {
      state: 'loaded',
      delegate: delegate
    };
  }

  clear() {
    this.cached = {};
  }

  private async fetchAndUpdate(publicKey: string): Promise<FullDelegate> {
    const res = await this.api.delegates.byForgingKey(publicKey);
    // @ts-ignore TODO types in dpos-offline
    const delegate = res.account || res.delegate || null;
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
    publicKey: res.account.forgingPK,
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
    publicKey: parsed.publicKey || (local ? local.publicKey : null),
    broadcastedPublicKey: parsed.publicKey || null
  } as TAccount;
}

export function parseTransactionsResponse(
  wallet: WalletStore,
  accountID: string,
  res: TTransactionsResponse
): Transaction[] {
  return res.transactions.map(raw => {
    // fix server time
    raw.timestamp = timestampToUnix(raw.timestamp);
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

// TODO get from `risejs` once available
export type APIUncofirmedTransaction = {
  // TODO never null?
  amount: null | number | string;
  // TODO never a number?
  fee: number | string;
  id: string;
  recipientId?: string;
  recipientPublicKey?: string;
  senderId: string;
  senderPubData: string;
  signature: string;
  timestamp: number;
  type: TransactionType;
};

// TODO get from `risejs` once available
export type APITransaction = APIUncofirmedTransaction & {
  asset: {
    signature?: {};
    votes?: string[];
    delegate?: {
      username: string;
    };
  };
  blockId: string;
  confirmations: number;
  height: number;
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
  senderPubData?: string;
  address?: string;
};

export type TTransactionsResponse = {
  count: number;
  success: boolean;
  transactions: APITransaction[];
};

export type TStoredAccount = {
  id: string;
  localId: number;
  publicKey: string;
  type: AccountType;
  hwId: null | string;
  hwSlot: null | number;
  fiatCurrency: string;
  name: string;
  pinned: boolean;
};

export type TAccount = TStoredAccount & {
  broadcastedPublicKey: string | null;
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

export type TFeesResponse = {
  fees: {
    send: string;
    vote: string;
    secondsignature: string;
    delegate: string;
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
