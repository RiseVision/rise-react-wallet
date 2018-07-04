import * as React from 'react';
import { IntlProvider } from 'react-intl';
import Store from '../store';
import ThemeProvider from './ThemeProvider';
import { observer, inject } from 'mobx-react';
import { MobxRouter } from 'mobx-router';

interface Props {
  store?: Store;
}

interface State {
}

@inject('store')
@observer
class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
    };
  }

  render() {
    let currentError = null;
    let isLoading = false;

    const store = this.props.store!;
    let locale = store.locale;

    let translations = store.translations[locale];
    if (!translations) {
      if (store.translationError) {
        currentError = store.translationError;
      } else {
        isLoading = true;
      }
    }

    if (!translations) {
      // Fallback to English to prevent warnings in console
      locale = 'en';
      translations = {};
    }

    let content = null;

    if (currentError !== null) {
      // TODO: Implement better error rendering
      let message;
      if (currentError instanceof Error) {
        message = currentError.message;
      } else {
        message = '' + currentError;
      }

      content = (
        <div style={{position: 'relative'}}>{message}</div>
      );
    } else if (isLoading) {
      // TODO: Implement better loading indicator
      content = (
        <div style={{position: 'relative'}}>loading...</div>
      );
    }

    return (
      <ThemeProvider>
        <IntlProvider key={locale} locale={locale} messages={translations}>
            <React.Fragment>
              {content}
              <MobxRouter />
            </React.Fragment>
          </IntlProvider>
      </ThemeProvider>
    );
  }
}

export default App;
