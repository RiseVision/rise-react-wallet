import { RouterStore } from 'mobx-router-rise';
import { onboardingAddAccountRoute } from '../routes';
import AddressBookStore from './addressBook';
import TranslationsStore from './app';
import { TConfig } from './index';
import Wallet, { TStoredAccount } from './wallet';
import * as sinon from 'sinon';
import * as lstore from 'store';
import { accounts as accountsFixture } from './fixtures';

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
  // stub
  stubs = [];
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
    const wallet = new Wallet(config, router, addressBook, translations);
    expect(router.goTo.calledWith(onboardingAddAccountRoute)).toBeTruthy();
  });
  it.skip('signs in the latest account', () => {});
});

describe('accounts', () => {
  it.skip('saveAccount', () => {});
  it.skip('getAccount', () => {});
  it.skip('getAccountbyID', () => {});
  it.skip('loadAccount', () => {});
  it.skip('refreshAccount', () => {});
  it.skip('login', () => {});
  it.skip('observeAccount', () => {});
  it.skip('selectAccount', () => {});
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
});
