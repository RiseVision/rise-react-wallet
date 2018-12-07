import isElectron from 'is-electron';
import LedgerHub, {
  ILedgerChannel,
  LedgerChannelIPC
} from '../utils/ledgerHub';

/** TODO add connection status observables */
export default class LedgerStore {
  // only in the browser
  private hub: LedgerHub | null = null;

  get hasBrowserSupport() {
    return isElectron() || this.hub.hasBrowserSupport;
  }

  constructor() {
    if (!isElectron()) {
      this.hub = new LedgerHub();
    }
  }

  openChannel(): ILedgerChannel {
    debugger
    return isElectron() ? new LedgerChannelIPC() : this.hub.openChannel();
  }
}
