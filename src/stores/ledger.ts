import LedgerHub, { LedgerChannel } from '../utils/ledgerHub';

/** TODO add connection status observables */
export default class LedgerStore {
  // only in the browser
  private hub: LedgerHub = new LedgerHub();

  get hasBrowserSupport() {
    return this.hub.hasBrowserSupport;
  }

  constructor() {}

  openChannel(): LedgerChannel {
    return this.hub.openChannel();
  }
}
