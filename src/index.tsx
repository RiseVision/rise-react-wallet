///<reference path="missing.d.ts"/>
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './containers/App';
import * as routes from './routes';
import * as config from './config.json';
import Store, { TConfig } from './stores/store';
import registerServiceWorker from './registerServiceWorker';
import { startRouter } from 'mobx-router';
import { Provider } from 'mobx-react';
import WalletStore from './stores/wallet';

// tslint:disable-next-line:no-any
const store = new Store((config as any) as TConfig);
const walletStore = new WalletStore(store);
store.walletStore = walletStore;
startRouter(routes, store);

const stores = {
  store,
  walletStore
};

const root = (
  <Provider {...stores}>
    <App />
  </Provider>
);

ReactDOM.render(root, document.getElementById('root') as HTMLElement);
registerServiceWorker();
