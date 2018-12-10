import LedgerHub, { LedgerChannel } from '../utils/ledgerHub';

/** TODO add connection status observables */
export default class LedgerStore {
  private hub: LedgerHub = new LedgerHub();

  get hasSupport() {
    return this.hub.hasSupport;
  }

  openChannel(): LedgerChannel {
    return this.hub.openChannel();
  }
}
