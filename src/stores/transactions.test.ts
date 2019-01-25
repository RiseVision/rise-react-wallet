// tslint:disable:no-unused-expression
// tslint:disable:no-shadowed-variable
import * as lstore from 'store';
import { mockStoredContacts, stub } from '../utils/testHelpers';
import { timestampToUnix } from '../utils/utils';
import LangStore from './lang';
import {
  storedContacts,
  storedAccounts,
  config,
  serverTransactionsConfirmed
} from './fixtures';
import TransactionsStore, { Transaction } from './transactions';
import WalletStore, { parseTransactionsResponse } from './wallet';
import * as sinon from 'sinon';
import { TransactionType } from 'risejs';

let stubs: sinon.SinonStub[];

beforeEach(() => {
  // array to keep stubs to restore them later
  stubs = [];
  // stub methods making network requests
  stub(stubs, LangStore.prototype, 'loadTranslation', () => {
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
  const lang = new LangStore();
  const wallet: Partial<WalletStore> = {
    idToName(address: string) {
      return address;
    },
    getRecipientName(type: TransactionType, id: string) {
      return id;
    },
    fetchTransactions: sinon.stub(),
    config,
    lang
  };

  beforeEach(() => {
    mockStoredContacts(storedContacts);
    // @ts-ignore mocked wallet
    store = new TransactionsStore(config, id, wallet);
    // TODO generate transactions with current dates
    const txs = parseTransactionsResponse(
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

  it('loadMore', async () => {
    // TODO generate transactions with current dates
    const txs = parseTransactionsResponse(
      // @ts-ignore mocked wallet
      wallet,
      id,
      serverTransactionsConfirmed
    );
    // @ts-ignore sinon stub
    wallet.fetchTransactions.returns(txs);
    await store.loadMore();
    // @ts-ignore sinon stub
    expect(wallet.fetchTransactions.calledWith(id, 16));
  });
});

describe('Transaction class', () => {
  const accountID = storedAccounts[1].id;
  // mock the wallet
  const wallet: Partial<WalletStore> = {
    idToName(address: string) {
      return address;
    },
    getRecipientName(type: TransactionType, id: string) {
      return id;
    },
    fetchTransactions: sinon.spy(),
    config
  };

  beforeEach(() => {
    mockStoredContacts(storedContacts);
  });

  it('constructor', () => {
    // TODO exclusive fixture
    const raw = serverTransactionsConfirmed.transactions[1];
    const transaction = new Transaction(
      // @ts-ignore mocked wallet
      wallet,
      accountID,
      raw
    );
    // test simple fields
    const fields = [
      'confirmations',
      'blockId',
      'senderId',
      'relays',
      'receivedAt',
      'type',
      'senderPublicKey',
      'requesterPublicKey',
      'asset',
      'recipientId',
      'signature',
      'id',
      'signatures',
      'assets',
      'recipientPublicKey'
    ];
    for (const field of fields) {
      expect(transaction[field]).toEqual(raw[field]);
    }
    // test parsed fields
    expect(transaction.timestamp).toEqual(timestampToUnix(raw.timestamp));
    expect(transaction.amount.toNumber()).toEqual(raw.amount);
    expect(transaction.fee.toNumber()).toEqual(raw.fee);
    expect(transaction.amountFee.toNumber()).toEqual(raw.amount + raw.fee);
    expect(transaction.isIncoming).toBeFalsy();
  });

  it('vote transaction', () => {
    // TODO exclusive fixture
    const voteTx = serverTransactionsConfirmed.transactions.find(
      tx => tx.type === TransactionType.VOTE
    );
    const tx = new Transaction(
      // @ts-ignore mocked wallet
      wallet,
      accountID,
      voteTx
    );
    expect(tx.isIncoming).toBeFalsy();
  });
});
