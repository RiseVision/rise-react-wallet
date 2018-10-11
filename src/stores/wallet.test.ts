import { RouterStore } from 'mobx-router-rise';
import { onboardingAddAccountRoute } from '../routes';
import AccountStore from './account';
import AddressBookStore from './addressBook';
import TranslationsStore from './app';
import { TConfig } from './index';
import Wallet, { TStoredAccount } from './wallet';
import * as sinon from 'sinon';
import * as lstore from 'store';
import { localAccounts, serverAccounts } from './fixtures';
import { last } from 'lodash';

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
  // stub loadTranslation
  stubs.push(
    sinon.stub(TranslationsStore.prototype, 'loadTranslation').callsFake(() => {
      // empty
    })
  );
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

describe('constructor', () => {
  it('init', () => {
    new Wallet(config, router, addressBook, translations);
  });
  it('redirects when no account', () => {
    sinon.spy(router, 'goTo');
    // init
    const wallet = new Wallet(config, router, addressBook, translations);
    // @ts-ignore
    expect(router.goTo.calledWith(onboardingAddAccountRoute)).toBeTruthy();
  });
  it('signs in the latest account', () => {
    mockStoredAccounts(localAccounts);
    lstore.set('lastSelectedAccount', localAccounts[1].id);
    // init
    const wallet = new Wallet(config, router, addressBook, translations);
    expect(wallet.selectedAccount.id).toEqual(localAccounts[1].id);
  });
  it('signs in the first account when the latest is missing', () => {
    mockStoredAccounts(localAccounts);
    // init
    const wallet = new Wallet(config, router, addressBook, translations);
    expect(wallet.selectedAccount.id).toEqual(localAccounts[0].id);
  });
});

describe.only('accounts', () => {
  let wallet: Wallet;
  beforeEach(() => {
    mockStoredAccounts(localAccounts);
    // TODO mock wallet.login, create server fixtures
    wallet = new Wallet(config, router, addressBook, translations);
  });
  it('saveAccount', () => {
    const id = localAccounts[0].id;
    const name = 'test98fds7idfsh';
    wallet.saveAccount({ id, name } as AccountStore);
    const saved = last(Object.values(lstore.get('accounts'))) as TStoredAccount;
    expect(saved.name).toEqual(name);
  });
  it('getAccountbyID', () => {
    const id = localAccounts[0].id;
    const account = wallet.getAccountByID(id);
    expect(account.name).toEqual(localAccounts[0].name);
  });
  it('saveAccount (observable)', () => {
    const id = localAccounts[0].id;
    const name = 'test98fds7idfsh';
    const account = wallet.getAccountByID(id);
    account.name = name;
    // observable auto saved the change
    const saved = last(Object.values(lstore.get('accounts'))) as TStoredAccount;
    expect(saved.name).toEqual(name);
  });
  it('loadAccount', async () => {
    const id = localAccounts[0].id;
    const balance = 983475;
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
    const id = localAccounts[0].id;
    const balance = 983475;
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
    const id = localAccounts[0].id;
    // stub the API response
    stubs.push(
      // TODO extract
      sinon
        .stub(wallet.dposAPI.accounts, 'getAccount')
        .returns(serverAccounts[0])
    );
    // delete existing accounts
    wallet.accounts.clear();
    await wallet.login(id, localAccounts[0]);
    const account = wallet.accounts.get(id);
    expect(account.balance.toString()).toEqual(
      serverAccounts[0].account.balance
    );
  });
  it('selectAccount', () => {
    const id = localAccounts[1].id
    wallet.selectAccount(id)
    expect(wallet.selectedAccount.id).toEqual(id)
  });
  it('idToName', () => {
    const id = localAccounts[1].id
    const name = localAccounts[1].name
    // create a fake address book contact
    wallet.addressBook.contacts.set('123R', 'test')
    expect(wallet.idToName(id)).toEqual(name)
    expect(wallet.idToName('123R')).toEqual('test')
  });
  it.skip('getRecipientName', () => {});
  it.skip('registerAccount', () => {});
  it.skip('removeAccount', () => {});
  it.skip('signout', () => {});
  it.skip('loadTransactions', () => {});
  it.skip('getContacts', () => {});
});

describe('API', () => {
  it.skip('createPassphraseTx', () => {});
  it.skip('createVoteTx', () => {});
  it.skip('createRegisterDelegateTx', () => {});
  it.skip('broadcastTransaction', () => {});
  it.skip('searchDelegates', () => {});
  it.skip('secondWallet', () => {});
  it.skip('loadVotedDelegate', () => {});
  it.skip('loadRegisteredDelegate', () => {});
  it.skip('loadRecentTransactions', () => {});
  it.skip('parseTransactionVotes', () => {});
  it.skip('parseAccountReponse', () => {});
});
