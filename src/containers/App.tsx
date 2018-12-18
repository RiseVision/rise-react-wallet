import * as keyboardJS from 'keyboardjs';
import { KeyEvent } from 'keyboardjs';
import { inject, observer } from 'mobx-react';
import { MobxRouter } from 'mobx-router-rise';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { IntlProvider } from 'react-intl';
import LoadingIndicator from '../components/LoadingIndicator';
import UpdateAvailableSnackbar from '../components/UpdateAvailableSnackbar';
import { accountSendNoIDRoute } from '../routes';
import LangStore from '../stores/lang';
import RootStore from '../stores/root';
import ThemeProvider from './ThemeProvider';

interface Props {
}

interface PropsInjected extends Props {
  store: RootStore;
  langStore: LangStore;
}

interface State {}

@inject('langStore')
@observer
class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  componentDidMount() {
    keyboardJS.bind('S', this.handlerOpenSendDialog);
  }

  componentWillUnmount() {
    keyboardJS.unbind('S', this.handlerOpenSendDialog);
  }

  handlerOpenSendDialog = (e: KeyEvent) => {
    const { store } = this.injected;
    e.preventDefault();
    e.stopPropagation();
    store.router.goTo(accountSendNoIDRoute);
  }

  render() {
    let currentError = null;
    let isLoading = false;

    const { langStore } = this.injected;
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
            <UpdateAvailableSnackbar />
          </React.Fragment>
        </IntlProvider>
      </ThemeProvider>
    );
  }
}

export default App;
