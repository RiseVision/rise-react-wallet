import { groupBy } from 'lodash';
import { computed, observable, runInAction, action } from 'mobx';
import * as moment from 'moment/min/moment-with-locales';
import { defineMessages } from 'react-intl';
import { TransactionType } from 'risejs';
import { RawAmount } from '../utils/amounts';
import { timestampToUnix } from '../utils/utils';
import { TConfig } from './index';
import WalletStore, {
  TGroupedTransactions,
  TTransactionVote,
  APITransaction
} from './wallet';
import MessageDescriptor = ReactIntl.FormattedMessage.MessageDescriptor;

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
    description: 'Grouping by date, eg "16th of Sep"',
    defaultMessage: 'Do of MMM'
  }
});

export default class TransactionsStore {
  // transactions have been fetched at least once
  fetched: boolean = false;

  @observable isLoading: boolean = false;
  @observable items = observable.array<Transaction>();
  @observable hasMore = false;

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
  ) {}

  /**
   * TODO
   * - dont re-download previous transactions
   * - recognize that there's no more transactions to load
   *
   * @param amount
   */
  @action
  async load(amount: number = 8) {
    this.isLoading = true;

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
  isIncoming: boolean;
  time: string;
  votes: TTransactionVote[];

  get senderName(): string | null {
    return this.wallet.idToName(this.senderId);
  }

  get recipientName(): string | null {
    return this.wallet.getRecipientName(this.type, this.recipientId);
  }

  protected fields = [
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
    this.importRaw(raw);
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
      .format(wallet.config.date_format);
  }

  private importRaw(raw: APITransaction) {
    for (const field of this.fields) {
      this[field] = raw[field];
    }
  }
}
