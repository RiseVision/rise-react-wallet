import { inject, observer } from 'mobx-react';
import { MobxRouter } from 'mobx-router-rise';
import * as React from 'react';
import { IntlProvider } from 'react-intl';
import { Helmet } from 'react-helmet';
import LangStore from '../stores/lang';
import ThemeProvider from './ThemeProvider';
import LoadingIndicator from '../components/LoadingIndicator';

interface Props {
  langStore?: LangStore;
}

interface State {}

@inject('langStore')
@observer
class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  render() {
    let currentError = null;
    let isLoading = false;

    const langStore = this.props.langStore!;
    let locale = langStore.locale;

    let translations = langStore.translations.get(locale);
    if (!translations && locale !== 'en') {
      if (langStore.translationError) {
        currentError = langStore.translationError;
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
