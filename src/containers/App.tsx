import * as React from 'react';
import { IntlProvider } from 'react-intl';
import { Locale, getUserLocales } from '../utils/i18n';
import { importTranslation } from '../translations';
import ModalBackdrop from '../components/ModalBackdrop';
import ThemeProvider from  './ThemeProvider';

interface Props {
}

const importOnboarding = () => import('./Onboarding').then((m) => m.default);
const importWallet = () => import('./Wallet').then((m) => m.default);

// tslint:disable-next-line:no-any
type LoaderFactory<T> = (...args: any[]) => Promise<T>;
// tslint:disable-next-line:no-any
type LoadedType<T extends LoaderFactory<any>> = T extends LoaderFactory<infer R> ? R : any;

// tslint:disable-next-line:no-any
type LoadState<T extends LoaderFactory<any>> =
  | { state: 'loading'; cancel: () => void; }
  | { state: 'done'; value: LoadedType<T>; }
  // tslint:disable-next-line:no-any
  | { state: 'error'; error: any; };

interface State {
  locale: Locale;
  page: string;
  translations: {
    [L in Locale]?: LoadState<typeof importTranslation>;
  };
  components: {
    onboarding?: LoadState<typeof importOnboarding>;
    wallet?: LoadState<typeof importWallet>;
  };
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    // TODO: Attempt to restore locale from a cookie/local storage.
    const locale = getUserLocales()[0] || 'en';

    this.state = {
      locale,
      page: 'onboarding-add-account',
      translations: {},
      components: {},
    };
  }

  setState<K extends keyof State>(
    state:
    | ((prevState: Readonly<State>, props: Props) => (Pick<State, K> | State | null))
    | (Pick<State, K> | State | null),
    callback?: () => void) {
    super.setState(
      (prevState, props) => {
        let interState: (Pick<State, K> | State | null);
        if (typeof state === 'function') {
          interState = state(prevState, props);
        } else {
          interState = state;
        }

        // Since state wasn't changed we can skip updates to the loaders as well
        if (interState === null) {
          return null;
        }

        // TS#13288 prevents the usage of spread syntax here
        let nextState = Object.assign({}, prevState, interState);

        const { locale, page } = nextState;
        const isOnboarding = (page || '').startsWith('onboarding-');

        nextState = this.loadTranslation(nextState, locale) || nextState;
        if (isOnboarding) {
          nextState = this.loadOnboardingComponent(nextState) || nextState;
        } else {
          nextState = this.loadWalletComponent(nextState) || nextState;
        }

        return nextState;
      },
      callback,
    );
  }

  loadTranslation(state: Readonly<State>, locale: Locale): (State | null) {
    const doLoad = !state.translations[locale];
    if (!doLoad) {
      return null;
    }

    let isCancelled = false;
    const initialLoad: LoadState<typeof importTranslation> = {
      state: 'loading',
      cancel: () => { isCancelled = true; },
    };

    const setLoadState = (value: LoadState<typeof importTranslation>) => {
      if (isCancelled) {
        return;
      }
      this.setState((prevState) => {
        const isCurrentLoad = prevState.translations[locale] === initialLoad;
        if (!isCurrentLoad) {
          return null;
        }
        return {
          translations: {
            ...prevState.translations,
            [locale]: value,
          },
        };
      });
    };

    importTranslation(locale).then(
      (val) => setLoadState({ state: 'done', value: val }),
      (err) => setLoadState({ state: 'error', error: err }),
    );

    return {
      ...state,
      translations: {
        ...state.translations,
        [locale]: initialLoad,
      },
    };
  }

  loadOnboardingComponent(state: Readonly<State>): (State | null) {
    const doLoad = !state.components.onboarding;
    if (!doLoad) {
      return null;
    }

    let isCancelled = false;
    const initialLoad: LoadState<typeof importOnboarding> = {
      state: 'loading',
      cancel: () => { isCancelled = true; },
    };

    const setLoadState = (value: LoadState<typeof importOnboarding>) => {
      if (isCancelled) {
        return;
      }
      this.setState((prevState) => {
        const isCurrentLoad = prevState.components.onboarding === initialLoad;
        if (!isCurrentLoad) {
          return null;
        }
        return {
          components: {
            ...prevState.components,
            onboarding: value,
          },
        };
      });
    };

    importOnboarding().then(
      (val) => setLoadState({ state: 'done', value: val }),
      (err) => setLoadState({ state: 'error', error: err }),
    );

    return {
      ...state,
      components: {
        ...state.components,
        onboarding: initialLoad,
      },
    };
  }

  loadWalletComponent(state: Readonly<State>): (State | null) {
    const doLoad = !state.components.wallet;
    if (!doLoad) {
      return null;
    }

    let isCancelled = false;
    const initialLoad: LoadState<typeof importWallet> = {
      state: 'loading',
      cancel: () => { isCancelled = true; },
    };

    const setLoadState = (value: LoadState<typeof importWallet>) => {
      if (isCancelled) {
        return;
      }
      this.setState((prevState) => {
        const isCurrentLoad = prevState.components.wallet === initialLoad;
        if (!isCurrentLoad) {
          return null;
        }
        return {
          components: {
            ...prevState.components,
            wallet: value,
          },
        };
      });
    };

    importWallet().then(
      (val) => setLoadState({ state: 'done', value: val }),
      (err) => setLoadState({ state: 'error', error: err }),
    );

    return {
      ...state,
      components: {
        ...state.components,
        wallet: initialLoad,
      },
    };
  }

  componentDidMount() {
    // Set the state to trigger async load of modules
    this.setState(this.state);
  }

  componentWillUnmount() {
    // Cancel all loading translactions & components
    const { translations, components } = this.state;
    for (let k in translations) {
      if (translations[k].state === 'loading') {
        translations[k].cancel();
      }
    }
    for (let k in components) {
      if (components[k].state === 'loading') {
        components[k].cancel();
      }
    }
  }

  render() {
    let currentError = null;
    let isLoading = false;

    let { locale } = this.state;
    let translations = null;

    const asyncTranslations = this.state.translations[locale];
    if (!asyncTranslations || asyncTranslations.state === 'loading') {
      isLoading = true;
    } else if (asyncTranslations.state === 'error') {
      currentError = currentError || asyncTranslations.error;
    } else if (asyncTranslations.state === 'done') {
      translations = asyncTranslations.value;
    }

    if (translations === null) {
      // Fallback to English to prevent warnings in console
      locale = 'en';
      translations = {};
    }

    const isOnboarding = (this.state.page || '').startsWith('onboarding-');

    let content = null;
    if (isOnboarding) {
      const asyncComponent = this.state.components.onboarding;
      if (!asyncComponent || asyncComponent.state === 'loading') {
        isLoading = true;
      } else if (asyncComponent.state === 'error') {
        currentError = currentError || asyncComponent.error;
      } else if (asyncComponent.state === 'done') {
        const Onboarding = asyncComponent.value;
        content = (
          <Onboarding
            page={this.state.page}
            locale={this.state.locale}
            onPageChanged={this.handlePageChanged}
            onLocaleChanged={this.handleLocaleChanged}
          />
        );
      }
    } else {
      const asyncComponent = this.state.components.wallet;
      if (!asyncComponent || asyncComponent.state === 'loading') {
        isLoading = true;
      } else if (asyncComponent.state === 'error') {
        currentError = currentError || asyncComponent.error;
      } else if (asyncComponent.state === 'done') {
        const Wallet = asyncComponent.value;
        content = (
          <Wallet />
        );
      }
    }

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
            {isOnboarding && (
              <ModalBackdrop open={true} transitionDuration={0} />
            )}
            {content}
          </React.Fragment>
        </IntlProvider>
      </ThemeProvider>
    );
  }

  handlePageChanged = (page: string) => {
    this.setState({ page });
  }

  handleLocaleChanged = (locale: Locale) => {
    this.setState({ locale });
  }
}

export default App;
