import * as React from 'react';
import * as ReactDOM from 'react-dom';

import App from './containers/App';
import registerServiceWorker from './registerServiceWorker';

const root = (
  <App />
);

ReactDOM.render(root, document.getElementById('root') as HTMLElement);
registerServiceWorker();
