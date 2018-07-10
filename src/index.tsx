///<reference path="missing.d.ts"/>
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './containers/App';
import * as routes from './routes';
import App from './stores/app';
import registerServiceWorker from './registerServiceWorker';
import { startRouter } from 'mobx-router';
import { Provider } from 'mobx-react';

const store = new App();
startRouter(routes, store);

const root = (
  <Provider store={store}>
    <App />
  </Provider>
);

ReactDOM.render(root, document.getElementById('root') as HTMLElement);
registerServiceWorker();
