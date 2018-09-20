import { groupBy } from 'lodash';
import { computed, observable } from 'mobx';
import * as moment from 'moment-timezone';
import { TConfig } from './index';
import { TGroupedTransactions, TTransaction } from './wallet';

export default class TransactionsStore {
  // transactions has been fetched at least once
  fetched: boolean = false;

  @observable items = observable.array<TTransaction>();

  @computed
  get groupedByDay(): TGroupedTransactions {
    // @ts-ignore wrong lodash typing for groupBy
    return groupBy(this.items, (transaction: TTransaction) => {
      return moment(transaction.timestamp)
        .startOf('day')
        .calendar(undefined, {
          // TODO translate those
          lastWeek: '[Last] dddd',
          lastDay: '[Yesterday]',
          sameDay: '[Today]',
          nextDay: '[Tomorrow]',
          nextWeek: 'dddd',
          sameElse: () => {
            return this.config.date_format_short;
          }
        });
    });
  }

  constructor(public config: TConfig) {}
}
