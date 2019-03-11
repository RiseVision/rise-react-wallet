import * as keyboardJS from 'keyboardjs';
import { KeyEvent } from 'keyboardjs';
import { inject, observer } from 'mobx-react';
import { MobxRouter, RouterStore } from 'mobx-router-rise';
import * as React from 'react';
import { IntlProvider } from 'react-intl';
import LoadingIndicator from '../components/LoadingIndicator';
import AppHelmet from '../components/AppHelmet';
import UpdateAvailableSnackbar from '../components/UpdateAvailableSnackbar';
import { accountSendNoIDRoute } from '../routes';
import LangStore from '../stores/lang';
import ThemeProvider from './ThemeProvider';
// @ts-ignore TODO d.ts
import * as inobounce from 'inobounce';

// store info if the current platform is supported
inobounce.supported = inobounce.isEnabled();

interface Props {}

interface PropsInjected extends Props {
  routerStore: RouterStore;
  langStore: LangStore;
}

interface State {}

@inject('langStore')
@inject('routerStore')
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
    // skip for inputs
    if (
      e.target &&
      (e.target as HTMLElement).tagName.toLocaleLowerCase() === 'input'
    ) {
      return;
    }
    const { routerStore } = this.injected;
    e.preventDefault();
    e.stopPropagation();
    routerStore.goTo(accountSendNoIDRoute);
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
            <AppHelmet locale={locale} />
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
