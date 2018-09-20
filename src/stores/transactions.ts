import { groupBy } from 'lodash';
import { computed, observable } from 'mobx';
import * as moment from 'moment-timezone';
import { TConfig } from './index';
import WalletStore, { TGroupedTransactions, TTransaction } from './wallet';

export default class TransactionsStore {
  // transactions has been fetched at least once
  fetched: boolean = false;

  @observable isLoading: boolean = false;
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

  constructor(public config: TConfig, public accountID: string) {}

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
