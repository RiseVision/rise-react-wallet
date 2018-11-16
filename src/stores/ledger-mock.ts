export * from './ledger';
import LedgerStoreSuper, {
  LedgerHub as LedgerHubSuper,
  LedgerChannel as LedgerChannelSuper
} from './ledger';

export class LedgerHub extends LedgerHubSuper {}

export default class LedgerStore extends LedgerStoreSuper {
  protected hub = new LedgerHub();
}

export class LedgerChannel extends LedgerChannelSuper {}
