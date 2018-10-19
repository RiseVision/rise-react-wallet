import { TransactionType } from 'risejs';

// tslint:disable:no-unused-expression
// tslint:disable:no-shadowed-variable
import * as lstore from 'store';
import { mockStoredContacts, stub } from '../utils/testHelpers';
import { timestampToUnix } from '../utils/utils';
import TranslationsStore from './app';
import {
  storedContacts,
  storedAccounts,
  config,
  serverTransactionsConfirmed
} from './fixtures';
import TransactionsStore, { Transaction } from './transactions';
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

describe('TransactionsStore', () => {
  let store: TransactionsStore;
  const id = storedAccounts[0].id;
  // mock the wallet
  const translations = new TranslationsStore();
  const wallet = {
    idToName(address: string) {
      return address;
    },
    getRecipientName(type: TransactionType, id: string) {
      return id;
    },
    loadRecentTransactions: sinon.spy(),
    config,
    translations
  };

  beforeEach(() => {
    mockStoredContacts(storedContacts);
    // @ts-ignore mocked wallet
    store = new TransactionsStore(config, id, wallet);
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
    store.loadMore();
    expect(wallet.loadRecentTransactions.calledWith(id, 16));
  });
});

describe('Transaction class', () => {
  const accountID = storedAccounts[0].id;
  // mock the wallet
  const wallet = {
    idToName(address: string) {
      return address;
    },
    getRecipientName(type: TransactionType, id: string) {
      return id;
    },
    loadRecentTransactions: sinon.spy(),
    config
  };

  beforeEach(() => {
    mockStoredContacts(storedContacts);
  });

  it('constructor', () => {
    const raw = serverTransactionsConfirmed.transactions[0];
    const transaction = new Transaction(
      // @ts-ignore mocked wallet
      wallet,
      accountID,
      raw
    );
    expect(transaction.timestamp).toEqual(timestampToUnix(raw.timestamp));
    expect(transaction.amount.toNumber()).toEqual(raw.amount);
    expect(transaction.fee.toNumber()).toEqual(raw.fee);
    expect(transaction.amountFee.toNumber()).toEqual(raw.amount + raw.fee);
    expect(transaction.isIncoming).toBeFalsy();
    const skip = ['amount', 'fee', 'timestamp'];
    // @ts-ignore protected field
    const fields = transaction.fields.filter(f => !skip.includes(f));
    for (const field of fields) {
      expect(transaction[field]).toEqual(raw[field]);
    }
  });
});
