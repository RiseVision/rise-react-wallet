import * as bip39 from 'bip39';
import {
  LiskWallet,
  CreateSignatureTx,
  VoteTx,
  DelegateTx
} from 'dpos-offline';
import { last } from 'lodash';
import { RouterStore } from 'mobx-router-rise';
import { TransactionType } from 'risejs';
import * as sinon from 'sinon';
import * as lstore from 'store';
import VoteDelegateDialog from '../containers/wallet/VoteDelegateDialog';
import { onboardingAddAccountRoute } from '../routes';
import { TAddressSource } from '../utils/utils';
import AccountStore, { LoadingState } from './account';
import AddressBookStore, { TStoredContact } from './addressBook';
import TranslationsStore from './app';
import {
  storedAccounts,
  serverAccounts,
  storedContacts,
  serverTransactionsUnconfirmed,
  serverTransactionsConfirmed
} from './fixtures';
import { TConfig } from './index';
import Wallet, { TStoredAccount, TTransactionsRequest } from './wallet';
import { rise as dposAPI } from 'risejs';
import 'isomorphic-fetch';

const config: TConfig = {
  api_url: '',
  date_format: '',
  explorer_url: '',
  fiat_currencies: []
};

let stubs: any[];
let router: RouterStore;
let addressBook: AddressBookStore;
let translations: TranslationsStore;

beforeEach(() => {
  // array to keep stubs to restore them later
  stubs = [];

  // stub methods making network requests
  stub(TranslationsStore.prototype, 'loadTranslation', () => {
    // empty
  });
  stub(Wallet.prototype, 'loadRecentTransactions', () => {
    // empty
  });
  stub(Wallet.prototype, 'updateFees', () => {
    // empty
  });
  stub(Wallet.prototype, 'loadVotedDelegates', tx => {
    return tx;
  });
  // stub getAccount responses
  let getAccountsCounter = 0;
  stub(dposAPI.accounts, 'getAccount', id => {
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

function mockStoredAccounts(accounts: TStoredAccount[]) {
  lstore.set('accounts', accounts);
}

function mockStoredContacts(contacts: TStoredContact[]) {
  lstore.set('contacts', contacts);
}

function stub<T>(object: T, method: keyof T, fn: (...args: any[]) => void) {
  stubs.push(sinon.stub(object, method).callsFake(fn));
}

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
    stubs.push(
      // TODO extract
      sinon.stub(wallet.dposAPI.accounts, 'getAccount').returns({
        account: { address: id, balance },
        success: true
      })
    );
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
    stubs.push(
      // TODO extract
      sinon.stub(wallet.dposAPI.accounts, 'getAccount').returns({
        account: { address: id, balance },
        success: true
      })
    );
    await wallet.refreshAccount(id);
    expect(wallet.accounts.get(id).balance.toNumber()).toEqual(balance);
  });
  it('login', async () => {
    const id = storedAccounts[0].id;
    // @ts-ignore restore to wrap again
    wallet.dposAPI.accounts.getAccount.restore();
    // stub the API response
    stubs.push(
      // TODO extract
      sinon
        .stub(wallet.dposAPI.accounts, 'getAccount')
        .returns(serverAccounts[0])
    );
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
    stubs.push(sinon.stub(wallet, 'login').returns(true));
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
  it.skip('parseAccountReponse', () => {});
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
    stub(wallet, 'fetch', () => {
      return new Response(JSON.stringify(serverTransactionsUnconfirmed));
    });
    // stub confirmed
    stub(wallet.dposAPI.transactions, 'getList', () => {
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
  it.skip('broadcastTransaction', () => {});
  it.skip('searchDelegates', () => {});
  it.skip('secondWallet', () => {});
  it.skip('loadVotedDelegate', () => {});
  it.skip('loadRegisteredDelegate', () => {});
  it.skip('loadRecentTransactions', () => {});
  it.skip('loadVotedDelegates', () => {});
});
