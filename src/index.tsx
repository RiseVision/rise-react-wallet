/// <reference path="utils/missing.d.ts"/>
import './polyfills';
import { Provider } from 'mobx-react';
import { startRouter } from 'mobx-router-rise';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as config from './config.json';
import App from './containers/App';
import registerServiceWorker from './registerServiceWorker';
import * as routes from './routes';
import { TConfig, TStores } from './stores';
import RootStore from './stores/root';

const store = new RootStore((config as any) as TConfig);
startRouter(routes, store, { strict: false });

const stores: TStores = {
  store,
  langStore: store.lang,
  onboardingStore: store.onboarding,
  walletStore: store.wallet,
  routerStore: store.router,
  addressBookStore: store.addressBook,
  ledgerStore: store.ledger
};

const root = (
  <Provider {...stores}>
    <App />
  </Provider>
);

ReactDOM.render(root, document.getElementById('root') as HTMLElement);
registerServiceWorker(store);
