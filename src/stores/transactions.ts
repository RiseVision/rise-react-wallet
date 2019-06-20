import { groupBy } from 'lodash';
import { computed, observable, runInAction, action } from 'mobx';
import moment from 'moment/min/moment-with-locales';
import { defineMessages } from 'react-intl';
import { TransactionType } from 'risejs/dist/es5/types/beans';
import lstore from '../utils/store';
import { RawAmount } from '../utils/amounts';
import { TConfig } from './index';
import WalletStore, {
  TGroupedTransactions,
  TTransactionVote,
  APITransaction,
  APIUncofirmedTransaction
} from './wallet';
import MessageDescriptor = ReactIntl.FormattedMessage.MessageDescriptor;
import { get } from 'lodash';

const messages = defineMessages({
  lastWeek: {
    id: 'transaction.group-date-last-week',
    description:
      'Grouping by date, eg "Last Monday", must be in square brackets',
    defaultMessage: '[Last] dddd'
  },
  yesterday: {
    id: 'transaction.group-date-yesterday',
    description: 'Grouping by date, "Yesterday", must be in square brackets',
    defaultMessage: '[Yesterday]'
  },
  tomorrow: {
    id: 'transaction.group-date-tomorrow',
    description: 'Grouping by date, "Tomorrow", must be in square brackets',
    defaultMessage: '[Tomorrow]'
  },
  today: {
    id: 'transaction.group-date-today',
    description: 'Grouping by date, "Today", must be in square brackets',
    defaultMessage: '[Today]'
  },
  short: {
    id: 'transaction.group-date-short',
    description:
      'Grouping by date, eg "16th of Sep". See https://momentjs.com/docs/#/displaying/format/ format tokens.',
    defaultMessage: 'Do of MMM'
  }
});

export default class TransactionsStore {
  // transactions have been fetched at least once
  fetched: boolean = false;

  @observable isLoading: boolean = false;
  @observable items = observable.array<Transaction>();
  @observable hasMore = false;
  @observable expanded = observable.array<string>();

  /**
   * Data is potentially dirty and need to be re-downloaded from the server.
   * This happens after being offline.
   */
  isDirty = false;

  @computed
  get groupedByDay(): TGroupedTransactions {
    const msg = (desc: MessageDescriptor) => {
      return this.wallet.lang.get(desc);
    };
    // switch the locale of every new `moment` instance
    moment.locale(this.wallet.lang.locale);
    // @ts-ignore wrong lodash typing for groupBy
    return groupBy(this.items, (transaction: Transaction) => {
      return moment
        .utc(transaction.timestamp)
        .local()
        .startOf('day')
        .calendar(undefined, {
          lastWeek: msg(messages.lastWeek),
          lastDay: msg(messages.yesterday),
          sameDay: msg(messages.today),
          nextDay: msg(messages.tomorrow),
          nextWeek: 'dddd',
          sameElse: () => {
            return msg(messages.short);
          }
        });
    });
  }

  constructor(
    public config: TConfig,
    public accountID: string,
    public wallet: WalletStore
  ) {
    this.loadCache();
  }

  /**
   * @param amount
   */
  @action
  async load(amount: number = this.items.length) {
    runInAction(() => {
      this.isLoading = true;
    });
    amount = amount || 8;

    try {
      const transactions = await this.wallet.fetchTransactions(
        this.accountID,
        amount
      );

      runInAction(() => {
        this.fetched = true;
        this.items.length = 0;
        this.items.push(...transactions);
        this.hasMore = transactions.length === amount;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
    this.isDirty = false;
    this.saveCache();
  }

  @action
  async loadMore(amount: number = 8) {
    runInAction(() => {
      this.isLoading = true;
    });

    try {
      const page = await this.wallet.fetchTransactions(
        this.accountID,
        amount,
        this.items.length
      );

      runInAction(() => {
        this.isLoading = false;
        this.fetched = true;
        this.items.push(...page);
        this.hasMore = page.length === amount;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
    this.saveCache();
  }

  saveCache() {
    if (!this.items.length) {
      return;
    }
    const data: Partial<TransactionsStore> = {};
    for (const field in this) {
      if (this[field] instanceof RawAmount) {
        // @ts-ignore
        data[field] = this[field].toNumber();
      } else {
        // @ts-ignore
        data[field] = this[field];
      }
    }
    const cache = lstore.get('cache') || {};
    cache.transactions = cache.transactions || {};
    cache.transactions[this.accountID] = {
      items: this.items.map(t => t.serialize()),
      hasMore: this.hasMore
    };
    lstore.set('cache', cache);
  }

  loadCache() {
    const cache = get(lstore.get('cache'), ['transactions', this.accountID]);
    if (!cache) {
      return;
    }
    this.items.length = 0;
    for (const item of cache.items) {
      this.items.push(new Transaction(this.wallet, this.accountID, item));
    }
    this.hasMore = cache.hasMore;
    this.isDirty = true;
  }
}

export class Transaction {
  asset: {
    signature?: {};
    votes?: string[];
    delegate?: {
      username: string;
    };
  };
  blockId: string;
  confirmations: number = 0;
  height: number;
  id: string;
  recipientId?: string;
  recipientPublicKey?: string;
  senderId: string;
  senderPubData: string;
  signature: string;
  // TODO
  // tslint:disable-next-line:no-any
  signatures: any[];
  timestamp: number;
  type: TransactionType;
  amount: RawAmount;
  amountFee: RawAmount;
  fee: RawAmount;
  /**
   * TODO may be a problem when keeping the same transaction for 2 users #191
   */
  isIncoming: boolean;
  time: string;
  // should never be null / undefined
  votes: TTransactionVote[] = [];

  get senderName(): string | null {
    return this.wallet.idToName(this.senderId);
  }

  get recipientName(): string | null {
    return this.wallet.getRecipientName(this.type, this.recipientId);
  }

  protected rawFields = [
    'blockId',
    'confirmations',
    'senderId',
    'relays',
    'receivedAt',
    'type',
    'amount',
    'senderPubData',
    'requesterPublicKey',
    'timestamp',
    'asset',
    'recipientId',
    'signature',
    'id',
    'fee',
    'signatures',
    'assets',
    'recipientPublicKey',
    'votes'
  ];

  constructor(
    public wallet: WalletStore,
    accountID: string,
    raw: APITransaction | APIUncofirmedTransaction
  ) {
    this.importRaw(raw, accountID);
  }

  serialize(): Partial<Transaction> {
    const data: Partial<Transaction> = {};
    for (const field in this) {
      if (!this.hasOwnProperty(field)) {
        continue;
      }
      const skipFields = [
        'wallet',
        'rawFields',
        'time',
        'amountFee',
        'isIncoming'
      ];
      if (skipFields.includes(field)) {
        continue;
      }
      if (this[field] instanceof RawAmount) {
        // @ts-ignore
        data[field] = this[field].toNumber();
      } else {
        // @ts-ignore
        data[field] = this[field];
      }
    }
    return data;
  }

  private importRaw(
    raw: APITransaction | APIUncofirmedTransaction,
    accountID: string
  ) {
    for (const field of this.rawFields) {
      this[field] = raw[field];
    }
    const amount = new RawAmount(raw.amount || 0);
    const fee = new RawAmount(raw.fee);
    this.amount = amount;
    this.amountFee = amount.plus(fee);
    this.fee = fee;
    this.isIncoming = raw.senderId !== accountID;
    this.time = moment
      .utc(this.timestamp)
      .local()
      .format(this.wallet.config.date_format);
  }
}
