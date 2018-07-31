import { configure } from 'mobx';
import { RouterStore } from 'mobx-router';
import { TConfig } from './index';
import AppStore from './app';
import WalletStore from './wallet';

// make sure only actions modify the store
configure({ enforceActions: true });

export default class RootStore {
  router = new RouterStore();
  app = new AppStore();
  wallet: WalletStore | null;

  constructor(public config: TConfig) {}
}
