import { inject, observer } from 'mobx-react';
import { MobxRouter } from 'mobx-router';
import * as React from 'react';
import { IntlProvider } from 'react-intl';
import { Helmet } from 'react-helmet';
import AppStore from '../stores/app';
import ThemeProvider from './ThemeProvider';
import LoadingIndicator from '../components/LoadingIndicator';

interface Props {
  appStore?: AppStore;
}

interface State {}

@inject('appStore')
@observer
class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  render() {
    let currentError = null;
    let isLoading = false;

    const appStore = this.props.appStore!;
    let locale = appStore.locale;

    let translations = appStore.translations.get(locale);
    if (!translations && locale !== 'en') {
      if (appStore.translationError) {
        currentError = appStore.translationError;
      } else {
        isLoading = true;
      }
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

      content = <div style={{ position: 'relative' }}>{message}</div>;
    } else if (isLoading) {
      content = <LoadingIndicator />;
    }

    return (
      <ThemeProvider>
        <IntlProvider key={locale} locale={locale} messages={translations}>
          <React.Fragment>
            <Helmet
              htmlAttributes={{
                lang: locale
              }}
            />
            {content}
            <MobxRouter />
          </React.Fragment>
        </IntlProvider>
      </ThemeProvider>
    );
  }
}

export default App;
