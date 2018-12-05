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
    return this.hub.openChannel();
  }

  async openIPCChannel(): Promise<ILedgerChannel> {
    // ask the server to create a new channel
    ipcRenderer.emit('open-channel');
    // get the channel ID back
    const channelID = await new Promise(
      (resolve: (channelId: number) => void) => {
        ipcRenderer.once('open-channel.result', resolve);
      }
    );
    return new LedgerChannelIPC(channelID);
  }
}
