import { groupBy } from 'lodash';
import { computed, observable, runInAction, action } from 'mobx';
import * as moment from 'moment/min/moment-with-locales';
import { defineMessages } from 'react-intl';
import { TransactionType } from 'risejs';
import * as lstore from 'store';
import { RawAmount } from '../utils/amounts';
import { timestampToUnix } from '../utils/utils';
import { TConfig } from './index';
import WalletStore, {
  TGroupedTransactions,
  TTransactionVote,
  APITransaction
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
    this.isLoading = true;
    amount = amount || 8;

    const transactions = await this.wallet.fetchTransactions(
      this.accountID,
      amount
    );

    runInAction(() => {
      this.isLoading = false;
      this.fetched = true;
      this.items.length = 0;
      this.items.push(...transactions);
      this.hasMore = transactions.length === amount;
    });
    this.isDirty = false;
    this.saveCache();
  }

  @action
  async loadMore(amount: number = 8) {
    this.isLoading = true;

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
    cache.transactions[this.accountID] = this.items.map(t => t.serialize());
    lstore.set('cache', cache);
  }

  loadCache() {
    const cache = lstore.get('cache') || {};
    const items = get(cache, ['transactions', this.accountID]);
    if (!items) {
      return;
    }
    for (const item of items) {
      this.items.push(new Transaction(this.wallet, this.accountID, item));
    }
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
  confirmations: number;
  height: number;
  id: string;
  recipientId?: string;
  recipientPublicKey?: string;
  senderId: string;
  senderPublicKey: string;
  signature: string;
  // TODO
  // tslint:disable-next-line:no-any
  signatures: any[];
  timestamp: number;
  type: TransactionType;
  amount: RawAmount;
  amountFee: RawAmount;
  fee: RawAmount;
  /** TODO may be a problem when keeping the same transaction for 2 users */
  isIncoming: boolean;
  time: string;
  votes: TTransactionVote[];

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
    'senderPublicKey',
    'requesterPublicKey',
    'timestamp',
    'asset',
    'recipientId',
    'signature',
    'id',
    'fee',
    'signatures',
    'assets',
    'recipientPublicKey'
  ];

  constructor(
    public wallet: WalletStore,
    accountID: string,
    raw: APITransaction
  ) {
    this.importRaw(raw, accountID);
  }

  private importRaw(raw: APITransaction, accountID: string) {
    for (const field of this.rawFields) {
      this[field] = raw[field];
    }
    const amount = new RawAmount(raw.amount || 0);
    const fee = new RawAmount(raw.fee);
    this.timestamp = timestampToUnix(raw.timestamp);
    this.amount = amount;
    this.amountFee = amount.plus(fee);
    this.fee = fee;
    this.isIncoming = raw.senderId !== accountID;
    this.time = moment
      .utc(timestampToUnix(raw.timestamp))
      .local()
      .format(this.wallet.config.date_format);
  }

  serialize(): Partial<Transaction> {
    const data: Partial<Transaction> = {};
    for (const field in this) {
      if (['wallet', 'rawFields'].includes(field)) {
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
}
