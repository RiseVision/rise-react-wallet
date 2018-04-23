import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IntlProvider } from 'react-intl';

import ThemeProvider from  './containers/ThemeProvider';
import App from './containers/App';
import registerServiceWorker from './registerServiceWorker';

const root = (
  <IntlProvider locale="en">
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </IntlProvider>
);

ReactDOM.render(root, document.getElementById('root') as HTMLElement);
registerServiceWorker();
