import LedgerHub, { LedgerChannel } from '../utils/ledgerHub';

/** TODO add connection status observables */
export default class LedgerStore {
  private hub = new LedgerHub();

  get hasBrowserSupport() {
    return this.hub.hasBrowserSupport;
  }

  openChannel(): LedgerChannel {
    return this.hub.openChannel();
  }
}
