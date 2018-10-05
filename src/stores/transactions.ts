import { groupBy } from 'lodash';
import { computed, observable } from 'mobx';
import * as moment from 'moment-timezone';
import AppStore from './app';
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
          lastWeek: this.translations.get(
            'transactions-date-last-week',
            '[Last] dddd'
          ),
          lastDay: this.translations.get(
            'transactions-date-yesterday',
            '[Yesterday]'
          ),
          sameDay: this.translations.get('transactions-date-today', '[Today]'),
          nextDay: this.translations.get(
            'transactions-date-tomorrow',
            '[Tomorrow]'
          ),
          nextWeek: 'dddd',
          sameElse: () => {
            return this.config.date_format_short;
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
