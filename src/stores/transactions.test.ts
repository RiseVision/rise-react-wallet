// tslint:disable:no-unused-expression
// tslint:disable:no-shadowed-variable
import * as lstore from 'store';
import { mockStoredContacts, stub } from '../utils/testHelpers';
import TranslationsStore from './app';
import {
  storedContacts,
  storedAccounts,
  config,
  serverTransactionsConfirmed
} from './fixtures';
import TransactionsStore from './transactions';
import { parseTransactionsReponse } from './wallet';
import * as sinon from 'sinon';

let stubs: sinon.SinonStub[];

beforeEach(() => {
  // array to keep stubs to restore them later
  stubs = [];
  // stub methods making network requests
  stub(stubs, TranslationsStore.prototype, 'loadTranslation', () => {
    // empty
  });
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

describe('address book', () => {
  let store: TransactionsStore;
  const id = storedAccounts[0].id;
  const wallet = {
    idToName(address: string) {
      return address;
    },
    getRecipientName(id: string) {
      return id;
    },
    loadRecentTransactions: sinon.spy(),
    config
  };

  beforeEach(() => {
    const translations = new TranslationsStore();
    mockStoredContacts(storedContacts);
    store = new TransactionsStore(config, id, translations);
    // TODO generate transactions with current dates
    const txs = parseTransactionsReponse(
      // @ts-ignore mocked wallet
      wallet,
      id,
      serverTransactionsConfirmed
    );
    store.items.push(...txs);
  });

  it('groupedByDay', () => {
    const grouped = store.groupedByDay;
    expect(grouped).toHaveProperty('19th of Sep');
    expect(grouped['19th of Sep']).toHaveLength(4);
  });

  it('loadMore', () => {
    // @ts-ignore wallet mock
    store.loadMore(wallet);
    expect(wallet.loadRecentTransactions.calledWith(id, 16));
  });
});
