///<reference path="utils/missing.d.ts"/>
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './containers/App';
import * as routes from './routes';
import * as config from './config.json';
import registerServiceWorker from './registerServiceWorker';
import { startRouter } from 'mobx-router';
import { Provider } from 'mobx-react';
import { TConfig } from './stores';
import RootStore from './stores/root';

// tslint:disable-next-line:no-any
const store = new RootStore((config as any) as TConfig);
startRouter(routes, store);

const stores = {
  store,
  appStore: store.app,
  onboardingStore: store.onboarding,
  walletStore: store.wallet,
};

const root = (
  <Provider {...stores}>
    <App />
  </Provider>
);

ReactDOM.render(root, document.getElementById('root') as HTMLElement);
registerServiceWorker();
