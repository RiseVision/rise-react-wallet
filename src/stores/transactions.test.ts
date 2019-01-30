// tslint:disable:no-unused-expression
// tslint:disable:no-shadowed-variable
import * as lstore from 'store';
import { RawAmount } from '../utils/amounts';
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

  it('loadCache', async () => {
    const cache = {
      transactions: {
        '2655711995542512317R': {
          items: [
            {
              blockId: '10843499946461977343',
              confirmations: 3183,
              senderId: '2655711995542512317R',
              type: 0,
              amount: 100000000,
              senderPublicKey:
                '023bab3e17365565d7a796291f8d3bb6878a3083ea520fbd163db713d51b44f9',
              requesterPublicKey: null,
              timestamp: 1548772228000,
              asset: null,
              recipientId: '1859812488441241535R',
              signature:
                '7dfb2ff184c94310a8f98c4dd127717e4f4c313c9b5c08cad9900a7048f6e3dad3b4395efc60047c85ae7604df116a212c8a63d0bf6b37643c688e04b0698508',
              id: '2538278872511854573',
              fee: 10000000,
              signatures: []
            }
          ],
          hasMore: false
        }
      }
    };
    lstore.set('cache', cache);
    store.loadCache();
    expect(store.items).toHaveLength(1);
    expect(store.hasMore).toBeFalsy();
    // assert the timestamp isn't shifted
    expect(store.items[0].timestamp).toEqual(
      cache.transactions['2655711995542512317R'].items[0].timestamp
    );
    // assert proper class instances
    expect(store.items[0].amount).toBeInstanceOf(RawAmount);
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
