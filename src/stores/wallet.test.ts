import * as bip39 from 'bip39';
import {
  LiskWallet,
  CreateSignatureTx,
  VoteTx,
  DelegateTx,
  SendTx
} from 'dpos-offline';
import 'isomorphic-fetch';
import { last } from 'lodash';
import { RouterStore } from 'mobx-router-rise';
import { TransactionType, rise as dposAPI } from 'risejs';
import * as sinon from 'sinon';
import * as lstore from 'store';
import { onboardingAddAccountRoute } from '../routes';
import { RawAmount } from '../utils/amounts';
import {
  stub,
  mockStoredAccounts,
  mockStoredContacts
} from '../utils/testHelpers';
import { TAddressSource } from '../utils/utils';
import AccountStore, { LoadingState } from './account';
import AddressBookStore from './addressBook';
import TranslationsStore from './app';
import {
  storedAccounts,
  serverAccounts,
  storedContacts,
  serverTransactionsUnconfirmed,
  serverTransactionsConfirmed,
  serverDelegatesSearch,
  serverAccountsDelegates,
  serverDelegatesGetByPublicKey,
  serverTransactionDelegates,
  config
} from './fixtures';
import Wallet, {
  TStoredAccount,
  parseAccountReponse,
  parseTransactionsReponse
} from './wallet';

let stubs: any[];
let router: RouterStore;
let addressBook: AddressBookStore;
let translations: TranslationsStore;

beforeEach(() => {
  // array to keep stubs to restore them later
  stubs = [];

  // stub methods making network requests
  stub(stubs, TranslationsStore.prototype, 'loadTranslation', () => {
    // empty
  });
  stub(stubs, Wallet.prototype, 'loadRecentTransactions', () => {
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
  router = new RouterStore();
  addressBook = new AddressBookStore();
  translations = new TranslationsStore();
});

afterEach(() => {
  lstore.clearAll();
  // check if a test has failed
  if (!stubs) return;
  // dispose all the stubs
  for (const stub of stubs) {
    stub.restore();
  }
});

describe('constructor', () => {
  it('init', () => {
    new Wallet(config, router, addressBook, translations);
  });
  it('redirects when no account', () => {
    sinon.spy(router, 'goTo');
    // init
    new Wallet(config, router, addressBook, translations);
    // @ts-ignore
    expect(router.goTo.calledWith(onboardingAddAccountRoute)).toBeTruthy();
  });
  it('signs in the latest account', () => {
    mockStoredAccounts(storedAccounts);
    lstore.set('lastSelectedAccount', storedAccounts[1].id);
    // init
    const wallet = new Wallet(config, router, addressBook, translations);
    expect(wallet.selectedAccount.id).toEqual(storedAccounts[1].id);
  });
  it('signs in the first account when the latest is missing', () => {
    mockStoredAccounts(storedAccounts);
    // init
    const wallet = new Wallet(config, router, addressBook, translations);
    expect(wallet.selectedAccount.id).toEqual(storedAccounts[0].id);
  });
});

describe('accounts', () => {
  let wallet: Wallet;
  beforeEach(() => {
    mockStoredAccounts(storedAccounts);
    mockStoredContacts(storedContacts);
    wallet = new Wallet(config, router, addressBook, translations);
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
    expect(account.name).toEqual(storedAccounts[0].name);
  });
  it('saveAccount (observable)', () => {
    const id = storedAccounts[0].id;
    const name = 'test98fds7idfsh';
    const account = wallet.getAccountByID(id);
    account.name = name;
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
    const response = await wallet.loadAccount(id);
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
    expect(wallet.accounts.get(id).balance.toNumber()).toEqual(balance);
  });
  it('login', async () => {
    const id = storedAccounts[0].id;
    // @ts-ignore restore to wrap again
    wallet.dposAPI.accounts.getAccount.restore();
    // stub the API response
    // TODO extract
    stub(stubs, wallet.dposAPI.accounts, 'getAccount', () => serverAccounts[0]);
    // delete existing accounts
    wallet.accounts.clear();
    await wallet.login(id, storedAccounts[0]);
    const account = wallet.accounts.get(id);
    expect(account.balance.toString()).toEqual(
      serverAccounts[0].account.balance
    );
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
    const liskWallet = new LiskWallet(mnemonic, 'R');
    // stub wallet.login
    stub(stubs, wallet, 'login', () => true);
    const account = {
      id: liskWallet.address,
      publicKey: liskWallet.publicKey
    };
    expect(wallet.registerAccount(mnemonic.split(' '))).toEqual(
      liskWallet.address
    );
    // @ts-ignore
    expect(wallet.login.calledWith(account));
  });
  it('removeAccount', () => {
    const id = storedAccounts[0].id;
    const id2 = storedAccounts[1].id;
    wallet.removeAccount(id);
    expect(wallet.selectedAccount.id).toEqual(id2);
    expect([...wallet.accounts.keys()]).toHaveLength(2);
    expect(lstore.get('accounts')).toHaveLength(2);
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
    const contacts = wallet.getContacts();
    // assert accounts
    for (const a of storedAccounts) {
      expect(
        contacts.find(
          c =>
            c.id === a.id &&
            c.name === a.name &&
            c.source === TAddressSource.WALLET
        )
      );
    }
    // assert contacts
    for (const a of storedContacts) {
      expect(
        contacts.find(
          c =>
            c.id === a.id &&
            c.name === a.name &&
            c.source === TAddressSource.ADDRESS_BOOK
        )
      );
    }
  });
  it('parseAccountReponse', () => {
    // fake a virgin account
    const local = { ...storedAccounts[0], publickKey: null };
    const server = serverAccounts[0];
    // @ts-ignore TODO `number is not assignable to 0|1`
    const parsed = parseAccountReponse(server, local);
    expect(parsed.balance.toString()).toEqual(server.account.balance);
    expect(parsed.publicKey).toEqual(server.account.publicKey);
    expect(parsed.name).toEqual(local.name);
    expect(parsed.fiatCurrency).toEqual(local.fiatCurrency);
  });
});

describe('transactions', () => {
  let wallet: Wallet;
  beforeEach(() => {
    mockStoredAccounts(storedAccounts);
    mockStoredContacts(storedContacts);
    wallet = new Wallet(config, router, addressBook, translations);
  });
  it('loadRecentTransactions', async () => {
    // stub unconfirmed
    stub(stubs, wallet, 'fetch', () => {
      return new Response(JSON.stringify(serverTransactionsUnconfirmed));
    });
    // stub confirmed
    stub(stubs, wallet.dposAPI.transactions, 'getList', () => {
      return serverTransactionsConfirmed;
    });
    // @ts-ignore restore the (prototype) mock
    wallet.loadRecentTransactions.restore();
    await wallet.loadRecentTransactions(storedAccounts[0].id);
    const transactions = wallet.accounts.get(storedAccounts[0].id)
      .recentTransactions;
    expect(transactions.items).toHaveLength(5);
    expect(transactions.fetched).toBeTruthy();
  });
  it('createPassphraseTx', async () => {
    const pass = 'foo';
    const wallet2 = new LiskWallet(pass, 'R');
    const tx = await wallet.createPassphraseTx(pass, storedAccounts[0].id);
    expect(tx).toBeInstanceOf(CreateSignatureTx);
    expect(tx.type).toEqual(TransactionType.SIGNATURE);
    expect(tx.asset.signature.publicKey).toEqual(wallet2.publicKey);
  });
  it('createVoteTx', async () => {
    const account = wallet.selectedAccount;
    account.votedDelegateState = LoadingState.LOADED;
    const publicKey =
      '16b268f3c712d26697551389a7b1b8713a9070bae22843d07cdd6a1a6cba6fa3';
    const tx = await wallet.createVoteTx(publicKey, account.id);
    expect(tx).toBeInstanceOf(VoteTx);
    expect(tx.type).toEqual(TransactionType.VOTE);
    expect(tx.asset.votes).toContain(`+${publicKey}`);
  });
  it('createRegisterDelegateTx', async () => {
    const account = wallet.selectedAccount;
    account.registeredDelegateState = LoadingState.LOADED;
    const username = 'test';
    const tx = await wallet.createRegisterDelegateTx(username, account.id);
    expect(tx).toBeInstanceOf(DelegateTx);
    expect(tx.type).toEqual(TransactionType.DELEGATE);
    expect(tx.asset.delegate).toMatchObject({
      publicKey: account.publicKey,
      username
    });
  });
  it('createSendTx', async () => {
    const recipientID = storedAccounts[1].id;
    const amount = 1000000;

    const tx = await wallet.createSendTx(recipientID, new RawAmount(amount));
    expect(tx).toBeInstanceOf(SendTx);
    expect(tx.type).toEqual(TransactionType.SEND);
    expect(tx.amount).toEqual(amount);
    expect(tx.recipientId).toEqual(recipientID);
  });
  it('broadcastTransaction', async () => {
    const recipientID = storedAccounts[1].id;
    const amount = 1000000;
    const tx = await wallet.createSendTx(recipientID, new RawAmount(amount));
    stub(stubs, wallet.dposAPI.transactions, 'put', () => {
      // empty
    });
    stub(stubs, wallet, 'refreshAccount', async () => {
      // empty
    });
    await wallet.broadcastTransaction(tx, 'foo bar baz', 'test');
    expect(tx.senderPublicKey).toEqual(wallet.selectedAccount.secondPublicKey);
    expect(tx.secondSignature).toBeTruthy();
  });
});

describe('API calls', () => {
  let wallet: Wallet;
  beforeEach(() => {
    mockStoredAccounts(storedAccounts);
    mockStoredContacts(storedContacts);
    wallet = new Wallet(config, router, addressBook, translations);
  });
  it('searchDelegates', () => {
    const q = 'test';
    stub(stubs, wallet.dposAPI.delegates, 'search', () => {
      return serverDelegatesSearch;
    });
    wallet.searchDelegates(q);
    // @ts-ignore sinon spy
    expect(wallet.dposAPI.delegates.search.calledWith({ q }));
  });
  it('loadVotedDelegate', async () => {
    const account = wallet.selectedAccount;
    stub(stubs, wallet.dposAPI.accounts, 'getDelegates', () => {
      return serverAccountsDelegates;
    });
    await wallet.loadVotedDelegate(account.id);
    // @ts-ignore sinon spy
    expect(wallet.dposAPI.accounts.getDelegates.called);
    expect(account.votedDelegateState).toEqual(LoadingState.LOADED);
    expect(account.votedDelegate).toMatchObject(
      serverAccountsDelegates.delegates[0]
    );
  });
  it('loadRegisteredDelegate', async () => {
    const account = wallet.selectedAccount;
    stub(stubs, wallet.dposAPI.delegates, 'getByPublicKey', () => {
      return serverDelegatesGetByPublicKey;
    });
    await wallet.loadRegisteredDelegate(account.id);
    // @ts-ignore sinon spy
    expect(wallet.dposAPI.delegates.getByPublicKey.called);
    expect(account.registeredDelegateState).toEqual(LoadingState.LOADED);
    expect(account.registeredDelegate).toMatchObject(
      serverDelegatesGetByPublicKey.delegate
    );
  });
  it('loadTransactionDelegates', async () => {
    const account = wallet.selectedAccount;
    stub(stubs, wallet.dposAPI.delegates, 'getByPublicKey', () => {
      return serverDelegatesGetByPublicKey;
    });
    let tx = parseTransactionsReponse(
      wallet,
      account.id,
      serverTransactionDelegates
    )[0];
    // @ts-ignore unstub
    wallet.loadTransactionDelegates.restore();
    await wallet.loadTransactionDelegates(tx);
    expect(tx.votes[0].op).toEqual('remove');
    expect(tx.votes[0].delegate).toMatchObject(
      serverDelegatesGetByPublicKey.delegate
    );
  });
});
