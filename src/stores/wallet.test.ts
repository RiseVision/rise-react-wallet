// tslint:disable:no-unused-expression
// tslint:disable:no-shadowed-variable
import bip39 from 'bip39';
import { Rise } from 'dpos-offline';
import 'isomorphic-fetch';
import { last } from 'lodash';
import RouterStore from './router';
import { rise as dposAPI } from 'risejs';
import { TransactionType } from 'risejs/dist/es5/types/beans';
import sinon from 'sinon';
import { onboardingAddAccountRoute } from '../routes';
import { RawAmount } from '../utils/amounts';
import lstore from '../utils/store';
import {
  stub,
  mockStoredAccounts,
  mockStoredContacts
} from '../utils/testHelpers';
import { TAddressSource } from '../utils/utils';
import AccountStore, { LoadingState } from './account';
import AddressBookStore from './addressBook';
import {
  storedAccounts,
  serverAccounts,
  storedContacts,
  serverTransactionsUnconfirmed,
  serverTransactionsConfirmed,
  serverDelegatesSearch,
  serverDelegatesGetByUsername,
  serverTransactionDelegates,
  config
} from './fixtures';
import LangStore from './lang';
import Wallet, {
  TStoredAccount,
  parseAccountReponse,
  parseTransactionsResponse
} from './wallet';

let stubs: sinon.SinonStub[];
let router: RouterStore;
let addressBook: AddressBookStore;
let lang: LangStore;

beforeEach(() => {
  // array to keep stubs to restore them later
  stubs = [];

  // stub methods making network requests
  stub(stubs, LangStore.prototype, 'loadTranslation', () => {
    // empty
  });
  stub(stubs, Wallet.prototype, 'fetchTransactions', () => {
    // empty
  });
  stub(stubs, Wallet.prototype, 'updateFees', () => {
    // empty
  });
  stub(stubs, Wallet.prototype, 'loadTransactionDelegates', tx => {
    return tx;
  });
  // stub getAccount responses
  let getAccountsCounter = 0;
  stub(stubs, dposAPI.accounts, 'getAccount', id => {
    return serverAccounts[getAccountsCounter++];
  });

  // init
  // @ts-ignore
  router = new RouterStore({});
  mockStoredContacts(storedContacts);
  addressBook = new AddressBookStore();
  lang = new LangStore();
});

afterEach(() => {
  lstore.clearAll();
  // check if a test has failed
  if (!stubs) {
    return;
  }
  // dispose all the stubs
  for (const fn of stubs) {
    fn.restore();
  }
});

describe('constructor', () => {
  it('init', () => {
    new Wallet(config, router, addressBook, lang);
  });
  it('redirects when no account', () => {
    sinon.spy(router, 'goTo');
    // init
    new Wallet(config, router, addressBook, lang);
    // @ts-ignore
    expect(router.goTo.calledWith(onboardingAddAccountRoute)).toBeTruthy();
  });
  it('signs in the latest account', () => {
    mockStoredAccounts(storedAccounts);
    lstore.set('lastSelectedAccount', storedAccounts[1].id);
    // init
    const wallet = new Wallet(config, router, addressBook, lang);
    expect(wallet.selectedAccount.id).toEqual(storedAccounts[1].id);
  });
  it('signs in the first account when the latest is missing', () => {
    mockStoredAccounts(storedAccounts);
    // init
    const wallet = new Wallet(config, router, addressBook, lang);
    expect(wallet.selectedAccount.id).toEqual(storedAccounts[0].id);
  });
});

describe('accounts', () => {
  let wallet: Wallet;
  beforeEach(() => {
    mockStoredAccounts(storedAccounts);
    wallet = new Wallet(config, router, addressBook, lang);
  });
  it('saveAccount', () => {
    const id = storedAccounts[0].id;
    const name = 'test98fds7idfsh';
    wallet.saveAccount({ id, name } as AccountStore);
    const saved = last(Object.values(lstore.get('accounts'))) as TStoredAccount;
    expect(saved.name).toEqual(name);
  });
  it('getAccountbyID', () => {
    const id = storedAccounts[0].id;
    const account = wallet.getAccountByID(id);
    expect(account!.name).toEqual(storedAccounts[0].name);
  });
  it('saveAccount (observable)', () => {
    const id = storedAccounts[0].id;
    const name = 'test98fds7idfsh';
    const account = wallet.getAccountByID(id);
    account!.name = name;
    // observable auto saved the change
    const saved = last(Object.values(lstore.get('accounts'))) as TStoredAccount;
    expect(saved.name).toEqual(name);
  });
  it('loadAccount', async () => {
    const id = storedAccounts[0].id;
    const balance = 983475;
    // @ts-ignore restore to wrap again
    wallet.dposAPI.accounts.getAccount.restore();
    // stub the API response
    // TODO extract
    stub(stubs, wallet.dposAPI.accounts, 'getAccount', () => ({
      account: { address: id, balance },
      success: true
    }));
    // @ts-ignore protected
    const response = await wallet.fetchAccountData(id);
    expect(response.account).toEqual({ address: id, balance });
  });
  it('refreshAccount', async () => {
    const id = storedAccounts[0].id;
    const balance = 983475;
    // @ts-ignore restore to wrap again
    wallet.dposAPI.accounts.getAccount.restore();
    // stub the API response
    // TODO extract
    stub(stubs, wallet.dposAPI.accounts, 'getAccount', () => ({
      account: { address: id, balance },
      success: true
    }));
    await wallet.refreshAccount(id);
    expect(wallet.accounts.get(id)!.balance.toNumber()).toEqual(balance);
  });
  it('login', async () => {
    const id = storedAccounts[0].id;
    // @ts-ignore restore to wrap again
    wallet.dposAPI.accounts.getAccount.restore();
    // stub the API response
    // TODO extract
    stub(stubs, wallet.dposAPI.accounts, 'getAccount', () => serverAccounts[0]);
    // stub the connect method
    stub(stubs, wallet, 'connect', () => {
      // empty
    });
    // delete existing accounts
    wallet.accounts.clear();
    await wallet.login(id, storedAccounts[0]);
    const account = wallet.accounts.get(id);
    // check balance
    expect(account!.balance.toString()).toEqual(
      serverAccounts[0].account!.balance
    );
    // @ts-ignore check the websocket / fiat connection
    expect(wallet.connect.called).toBeTruthy();
  });
  it('selectAccount', () => {
    const id = storedAccounts[1].id;
    wallet.selectAccount(id);
    expect(wallet.selectedAccount.id).toEqual(id);
  });
  it('idToName', () => {
    const id = storedAccounts[1].id;
    const name = storedAccounts[1].name;
    // create a fake address book contact
    wallet.addressBook.contacts.set('123R', 'test');
    expect(wallet.idToName(id)).toEqual(name);
    expect(wallet.idToName('123R')).toEqual('test');
  });
  it('getRecipientName', () => {
    const id = storedAccounts[1].id;
    const name = storedAccounts[1].name;
    expect(wallet.getRecipientName(TransactionType.SEND, id)).toEqual(name);
  });
  it('registerAccount', () => {
    const mnemonic = bip39.generateMnemonic();
    const liskWallet = Rise.deriveKeypair(mnemonic);
    const addr = Rise.calcAddress(liskWallet.publicKey, 'main', 'v0');
    // stub wallet.login
    stub(stubs, wallet, 'login', () => true);
    expect(wallet.registerAccount(mnemonic.split(' '))).toEqual(addr);
    // @ts-ignore
    expect(wallet.login.calledWithMatch(addr)).toBeTruthy();
  });
  it('removeAccount', () => {
    const id = storedAccounts[0].id;
    const id2 = storedAccounts[1].id;
    wallet.removeAccount(id);
    expect(wallet.selectedAccount.id).toEqual(id2);
    expect([...wallet.accounts.keys()]).toHaveLength(3);
    expect(lstore.get('accounts')).toHaveLength(3);
  });
  it('signout', () => {
    wallet.signout();
    expect(lstore.get('accounts')).toBeFalsy();
    expect(lstore.get('lastSelectedAccount')).toBeFalsy();
    expect(lstore.get('contacts')).toBeFalsy();
    expect(wallet.accounts.size).toEqual(0);
    expect(wallet.selectedAccount).toBeFalsy();
  });
  it('getContacts', () => {
    const compareById = (a: { id: string }, b: { id: string }) => {
      if (a.id < b.id) {
        return -1;
      }
      if (a.id > b.id) {
        return 1;
      }
      return 0;
    };

    // We exclude the selected account from the dataset below, so make sure
    // that the actual selected account matches that of our excluded record
    expect(wallet.selectedAccount.id).toEqual('2655711995542512317R');

    const contacts = wallet.getContacts();
    contacts.sort(compareById);

    const { ADDRESS_BOOK, WALLET } = TAddressSource;
    const expected = [
      { id: '12525095472804841547R', name: 'DE AD', source: ADDRESS_BOOK },
      {
        id: '5399275477602875017R',
        name: 'test fixture 2',
        source: ADDRESS_BOOK
      },
      { id: '5932278668828702947R', name: 'test-2', source: WALLET },
      { id: '11543739950532038814R', name: '', source: WALLET },
      { id: '10317456780953445784R', name: 'test-3', source: WALLET }
    ];
    expected.sort(compareById);

    expect(contacts).toEqual(expected);
  });
  it('parseAccountReponse', () => {
    // fake a virgin account
    const local = { ...storedAccounts[0], publickKey: null };
    const server = serverAccounts[0];
    // @ts-ignore TODO `number is not assignable to 0|1`
    const parsed = parseAccountReponse(server, local);
    expect(parsed.balance.toString()).toEqual(server.account!.balance);
    expect(parsed.publicKey).toEqual(server.account!.publicKey);
    expect(parsed.name).toEqual(local.name);
    expect(parsed.fiatCurrency).toEqual(local.fiatCurrency);
  });
});

describe('transactions', () => {
  let wallet: Wallet;
  beforeEach(() => {
    mockStoredAccounts(storedAccounts);
    mockStoredContacts(storedContacts);
    wallet = new Wallet(config, router, addressBook, lang);
  });
  it('loadRecentTransactions', async () => {
    // stub unconfirmed
    stub(stubs, wallet, 'fetch', () => {
      return new Response(JSON.stringify(serverTransactionsUnconfirmed));
    });
    // stub confirmed
    stub(stubs, wallet.dposAPI.transactions, 'list', () => {
      return serverTransactionsConfirmed;
    });
    // @ts-ignore restore the (prototype) mock
    wallet.fetchTransactions.restore();
    await wallet.selectedAccount.recentTransactions.load();
    const transactions = wallet.accounts.get(storedAccounts[0].id)!
      .recentTransactions;
    expect(transactions.items).toHaveLength(
      serverTransactionsConfirmed.count + serverTransactionsUnconfirmed.count
    );
    expect(transactions.fetched).toBeTruthy();
  });
  it('createPassphraseTx', async () => {
    const pass = 'foo';
    const wallet2 = Rise.deriveKeypair(pass);
    const tx = await wallet.createPassphraseTx(pass, storedAccounts[0].id);
    expect(tx.type).toEqual(TransactionType.SIGNATURE);
    expect(tx.asset).toBeDefined();
    if (tx.asset) {
      expect(tx.asset.signature.publicKey).toEqual(
        wallet2.publicKey.toString('hex')
      );
    }
  });
  it('createVoteTx', async () => {
    const account = wallet.selectedAccount;
    account.votedDelegateState = LoadingState.LOADED;
    const publicKey =
      '16b268f3c712d26697551389a7b1b8713a9070bae22843d07cdd6a1a6cba6fa3';
    const tx = await wallet.createVoteTx(publicKey, account.id);
    expect(tx.type).toEqual(TransactionType.VOTE);
    expect(tx.asset).toBeDefined();
    if (tx.asset) {
      expect(tx.asset.votes).toContain(`+${publicKey}`);
    }
  });
  it('createRegisterDelegateTx', async () => {
    const account = wallet.selectedAccount;
    account.registeredDelegateState = LoadingState.LOADED;
    const username = 'test';
    const tx = await wallet.createRegisterDelegateTx(username, account.id);
    expect(tx.type).toEqual(TransactionType.DELEGATE);
    expect(tx.asset).toBeDefined();
    if (tx.asset) {
      expect(tx.asset.delegate).toMatchObject({
        username
      });
    }
  });
  it('createSendTx', async () => {
    const recipientID = storedAccounts[1].id;
    const amount = 1000000;

    const tx = await wallet.createSendTx(recipientID, new RawAmount(amount));
    expect(tx.type).toEqual(TransactionType.SEND);
    expect(tx.amount).toEqual(amount);
    expect(tx.recipientId).toEqual(recipientID);
  });
  it('signTransaction', async () => {
    const recipientID = storedAccounts[1].id;
    const amount = 1000000;
    const tx = await wallet.createSendTx(recipientID, new RawAmount(amount));
    const signedTx = wallet.signTransaction(tx, 'foo bar baz', 'test');
    expect(signedTx.senderPubData).toEqual(wallet.selectedAccount.publicKey);
    expect(signedTx.signatures).toBeTruthy();
  });
});

describe('API calls', () => {
  let wallet: Wallet;
  beforeEach(() => {
    mockStoredAccounts(storedAccounts);
    mockStoredContacts(storedContacts);
    wallet = new Wallet(config, router, addressBook, lang);
  });
  it('searchDelegates', () => {
    const q = 'test';
    stub(stubs, wallet.dposAPI.delegates, 'byUsername', () => {
      return serverDelegatesSearch;
    });
    wallet.searchDelegates(q);
    // @ts-ignore sinon spy
    expect(wallet.dposAPI.delegates.search.calledWith({ q })).toBeTruthy();
  });
  // it('loadVotedDelegate', async () => {
  //   const account = wallet.selectedAccount;
  //   // TODO mock the calls below
  //   // const res = await this.dposAPI.accounts.getVotes(account.id);
  //   // const delegateName = (res.votes && res.votes[0]) || null;
  //   // const delegateRes =
  //   //   res.votes && res.votes[0]
  //   //     ? await this.dposAPI.delegates.byUsername(delegateName)
  //   //     : null;
  //   stub(stubs, wallet.dposAPI.accounts, 'getDelegates', () => {
  //     return serverAccountsDelegates;
  //   });
  //   await wallet.loadVotedDelegate(account.id);
  //   // @ts-ignore sinon spy
  //   expect(wallet.dposAPI.accounts.getDelegates.called).toBeTruthy();
  //   expect(account.votedDelegateState).toEqual(LoadingState.LOADED);
  //   expect(account.votedDelegate).toMatchObject(
  //     serverAccountsDelegates.delegates[0]
  //   );
  // });
  it('loadRegisteredDelegate', async () => {
    const account = wallet.selectedAccount;
    stub(stubs, wallet.dposAPI.delegates, 'byUsername', () => {
      return serverDelegatesGetByUsername;
    });
    await wallet.loadRegisteredDelegate(account.id);
    // @ts-ignore sinon spy
    expect(wallet.dposAPI.delegates.getByPublicKey.called).toBeTruthy();
    expect(account.registeredDelegateState).toEqual(LoadingState.LOADED);
    expect(account.registeredDelegate).toMatchObject(
      serverDelegatesGetByUsername.delegate
    );
  });
  it('loadTransactionDelegates', async () => {
    const account = wallet.selectedAccount;
    stub(stubs, wallet.dposAPI.delegates, 'byForgingKey', () => {
      return serverDelegatesGetByUsername;
    });
    let tx = parseTransactionsResponse(
      wallet,
      account.id,
      serverTransactionDelegates
    )[0];
    // @ts-ignore unstub
    wallet.loadTransactionDelegates.restore();
    await wallet.loadTransactionDelegates(tx);
    expect(tx.votes[0].op).toEqual('remove');
    expect(tx.votes[0].delegate).toMatchObject(
      serverDelegatesGetByUsername.delegate
    );
  });
});
