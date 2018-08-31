import { Provider } from 'mobx-react';
import { startRouter } from 'mobx-router';
/// <reference path="utils/missing.d.ts"/>
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as config from './config.json';
import App from './containers/App';
import registerServiceWorker from './registerServiceWorker';
import * as routes from './routes';
import { TConfig, TStores } from './stores';
import RootStore from './stores/root';

// tslint:disable-next-line:no-any
const store = new RootStore((config as any) as TConfig);
startRouter(routes, store, { strict: false });

const stores: TStores = {
  store,
  appStore: store.app,
  onboardingStore: store.onboarding,
  walletStore: store.wallet,
  routerStore: store.router
};

const root = (
  <Provider {...stores}>
    <App />
  </Provider>
);

ReactDOM.render(root, document.getElementById('root') as HTMLElement);
registerServiceWorker();
