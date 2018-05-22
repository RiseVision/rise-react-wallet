import * as React from 'react';
import { IntlProvider } from 'react-intl';
import * as bip39 from 'bip39';
import { LiskWallet } from 'dpos-offline';
import { asyncComponent, Configuration as AsyncConfig } from 'react-async-component';
import { Locale, getUserLocales } from '../utils/i18n';
import { importTranslation } from '../translations';
import ThemeProvider from  '../containers/ThemeProvider';

interface Props {
}

interface State {
  locale: Locale;
  page: string;
  mnemonic: string[] | null;
  address: string | null;
}

function translatedComponent<P>(locale: Locale, config: AsyncConfig<P>): React.ComponentType<P> {
  const makeComponent = (messages: {}, InnerComponent: React.ComponentType<P>) => (props: P) => (
    <IntlProvider key={locale} locale={locale} messages={messages}>
      <InnerComponent {...props} />
    </IntlProvider>
  );
  return asyncComponent({
    ...config,
    resolve: () => {
      return Promise.all([config.resolve(), importTranslation(locale)])
        .then(([mod, messages]) => {
          const InnerComponent = 'default' in mod ? mod.default : mod;
          return makeComponent(messages, InnerComponent);
        });
    },
  });
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    // TODO: Attempt to restore locale from a cookie/local storage.
    const locale = getUserLocales()[0] || 'en';

    this.state = {
      locale,
      page: 'onboarding-add-account',
      address: null,
      mnemonic: null,
    };
  }

  newMnemonic(): string[] {
    return bip39.generateMnemonic().split(' ');
  }

  handleOpenOnboardingChooseLanguagePage = () => {
    this.setState({
      page: 'onboarding-choose-language',
      mnemonic: null,
    });
  }

  handleLanguageSelected = (locale: Locale) => {
    this.setState({
      locale: locale,
      page: 'onboarding-add-account',
      address: null,
      mnemonic: null,
    });
  }

  handleOpenOnboardingAddAccountPage = () => {
    this.setState({
      page: 'onboarding-add-account',
      address: null,
      mnemonic: null,
    });
  }

  handleOpenOnboardingNewAccountPage = () => {
    this.setState({
      page: 'onboarding-new-account',
      address: null,
      mnemonic: null,
    });
  }

  handleOpenOnboardingSecurityNoticePage = () => {
    this.setState({
      page: 'onboarding-security-notice',
      address: null,
      mnemonic: null,
    });
  }

  handleOpenOnboardingNewMnemonicPage = () => {
    this.setState({
      page: 'onboarding-new-mnemonic',
      address: null,
      mnemonic: this.newMnemonic(),
    });
  }

  handleOpenOnboardingVerifyMnemonicPage = () => {
    this.setState((prevState) => {
      if (prevState.mnemonic) {
        return {
          page: 'onboarding-verify-mnemonic',
          address: null,
          mnemonic: prevState.mnemonic,
        };
      } else {
        return {
          page: 'onboarding-new-mnemonic',
          address: null,
          mnemonic: this.newMnemonic(),
        };
      }
    });
  }

  handleOpenOnboardingAccountCreatedPage = () => {
    this.setState((prevState) => {
      if (prevState.mnemonic) {
        const wallet = new LiskWallet(prevState.mnemonic.join(' '), 'R');
        return {
          page: 'onboarding-account-created',
          mnemonic: null,
          address: wallet.address,
        };
      } else {
        return {
          page: 'onboarding-add-account',
          mnemonic: null,
          address: null,
        };
      }
    });
  }

  handleOpenOnboardingExistingAccountPage = () => {
    this.setState({
      page: 'onboarding-existing-account',
      mnemonic: null,
    });
  }

  handleOpenOnboardingExistingAccountTypePage = (address: string) => {
    this.setState({
      page: 'onboarding-existing-account-type',
      address: address,
      mnemonic: null,
    });
  }

  render() {
    let page = null;

    if (this.state.page === 'onboarding-add-account') {
      const OnboardingAddAccountPage = translatedComponent(this.state.locale, {
        resolve: () => import('../containers/OnboardingAddAccountPage'),
      });
      page = (
        <OnboardingAddAccountPage
          onOpenChooseLanguage={this.handleOpenOnboardingChooseLanguagePage}
          onOpenNewAccount={this.handleOpenOnboardingNewAccountPage}
          onOpenExistingAccount={this.handleOpenOnboardingExistingAccountPage}
        />
      );

    } else if (this.state.page === 'onboarding-choose-language') {
      const OnboardingChooseLanguagePage = translatedComponent(this.state.locale, {
        resolve: () => import('../containers/OnboardingChooseLanguagePage'),
      });
      page = (
        <OnboardingChooseLanguagePage
          onLanguageSelected={this.handleLanguageSelected}
        />
      );

    } else if (this.state.page === 'onboarding-new-account') {
      const OnboardingNewAccountPage = translatedComponent(this.state.locale, {
        resolve: () => import('../containers/OnboardingNewAccountPage'),
      });
      page = (
        <OnboardingNewAccountPage
          onGoBack={this.handleOpenOnboardingAddAccountPage}
          onGenerateMnemonic={this.handleOpenOnboardingSecurityNoticePage}
        />
      );

    } else if (this.state.page === 'onboarding-security-notice') {
        const OnboardingSecurityNoticePage = translatedComponent(this.state.locale, {
          resolve: () => import('../containers/OnboardingSecurityNoticePage'),
        });
        page = (
          <OnboardingSecurityNoticePage
            onClose={this.handleOpenOnboardingNewAccountPage}
            onContinue={this.handleOpenOnboardingNewMnemonicPage}
          />
        );

    } else if (this.state.page === 'onboarding-new-mnemonic' && !!this.state.mnemonic) {
      const OnboardingNewMnemonicPage = translatedComponent(this.state.locale, {
        resolve: () => import('../containers/OnboardingNewMnemonicPage'),
      });
      page = (
        <OnboardingNewMnemonicPage
          mnemonic={this.state.mnemonic}
          onClose={this.handleOpenOnboardingNewAccountPage}
          onVerifyMnemonic={this.handleOpenOnboardingVerifyMnemonicPage}
        />
      );

    } else if (this.state.page === 'onboarding-verify-mnemonic' && !!this.state.mnemonic) {
      const OnboardingVerifyMnemonicPage = translatedComponent(this.state.locale, {
        resolve: () => import('../containers/OnboardingVerifyMnemonicPage'),
      });
      page = (
        <OnboardingVerifyMnemonicPage
          mnemonic={this.state.mnemonic}
          onClose={this.handleOpenOnboardingNewAccountPage}
          onMnemonicVerified={this.handleOpenOnboardingAccountCreatedPage}
        />
      );

    } else if (this.state.page === 'onboarding-account-created' && !!this.state.address) {
      const OnboardingAccountCreatedPage = translatedComponent(this.state.locale, {
        resolve: () => import('../containers/OnboardingAccountCreatedPage'),
      });
      page = (
        <OnboardingAccountCreatedPage
          accountAddress={this.state.address}
          onOpenOverview={this.handleOpenOnboardingAddAccountPage}
        />
      );

    } else if (this.state.page === 'onboarding-existing-account') {
      const OnboardingExistingAccountPage = translatedComponent(this.state.locale, {
        resolve: () => import('../containers/OnboardingExistingAccountPage'),
      });
      page = (
        <OnboardingExistingAccountPage
          accountAddress={this.state.address || ''}
          onGoBack={this.handleOpenOnboardingAddAccountPage}
          onAddressEntered={this.handleOpenOnboardingExistingAccountTypePage}
        />
      );

    } else if (this.state.page === 'onboarding-existing-account-type') {
      const OnboardingExistingAccountTypePage = translatedComponent(this.state.locale, {
        resolve: () => import('../containers/OnboardingExistingAccountTypePage'),
      });
      page = (
        <OnboardingExistingAccountTypePage
          onGoBack={this.handleOpenOnboardingExistingAccountPage}
          onFullAccessSelected={this.handleOpenOnboardingAddAccountPage}
          onReadAccessSelected={this.handleOpenOnboardingAddAccountPage}
        />
      );
    }

    return (
      <ThemeProvider>
        {page}
      </ThemeProvider>
    );
  }
}

export default App;
