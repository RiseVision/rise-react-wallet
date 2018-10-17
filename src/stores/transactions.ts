import { groupBy } from 'lodash';
import { computed, observable } from 'mobx';
import * as moment from 'moment/min/moment-with-locales';
import { defineMessages } from 'react-intl';
import AppStore from './app';
import { TConfig } from './index';
import WalletStore, { TGroupedTransactions, TTransaction } from './wallet';

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
  @observable items = observable.array<TTransaction>();

  @computed
  get groupedByDay(): TGroupedTransactions {
    // switch the locale of every new `moment` instance
    moment.locale(this.translations.locale);
    // @ts-ignore wrong lodash typing for groupBy
    return groupBy(this.items, (transaction: TTransaction) => {
      return moment.utc(transaction.timestamp).local()
        .startOf('day')
        .calendar(undefined, {
          lastWeek: this.translations.get(messages.lastWeek),
          lastDay: this.translations.get(messages.yesterday),
          sameDay: this.translations.get(messages.today),
          nextDay: this.translations.get(messages.tomorrow),
          nextWeek: 'dddd',
          sameElse: () => {
            return this.translations.get(messages.short);
          }
        });
    });
  }

  constructor(
    public config: TConfig,
    public accountID: string,
    public translations: AppStore
  ) {}

  /**
   * TODO
   * - avoid passing the wallet
   * - dont duplicate previous transactions
   * - recognize then there's no more transactions to load
   *
   * @param wallet
   * @param amount
   */
  loadMore(wallet: WalletStore, amount: number = 8) {
    wallet.loadRecentTransactions(this.accountID, this.items.length + amount);
  }
}
