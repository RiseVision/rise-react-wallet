import * as React from 'react';
import { IntlProvider } from 'react-intl';
import * as bip39 from 'bip39';
import { LiskWallet } from 'dpos-offline';
import { Locale, getUserLocales } from '../utils/i18n';
import { importTranslation } from '../translations';
import ThemeProvider from  '../containers/ThemeProvider';
import OnboardingAddAccountPage from '../containers/OnboardingAddAccountPage';
import OnboardingChooseLanguagePage from '../containers/OnboardingChooseLanguagePage';
import OnboardingNewAccountPage from '../containers/OnboardingNewAccountPage';
import OnboardingSecurityNoticePage from '../containers/OnboardingSecurityNoticePage';
import OnboardingNewMnemonicPage from '../containers/OnboardingNewMnemonicPage';
import OnboardingVerifyMnemonicPage from '../containers/OnboardingVerifyMnemonicPage';
import OnboardingAccountCreatedPage from '../containers/OnboardingAccountCreatedPage';
import OnboardingExistingAccountPage from '../containers/OnboardingExistingAccountPage';
import OnboardingExistingAccountTypePage from '../containers/OnboardingExistingAccountTypePage';

interface Props {
}

interface State {
  locale: Locale;
  page: string;
  mnemonic: string[] | null;
  address: string | null;
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
    return (
      <IntlProvider locale={this.state.locale}>
        <ThemeProvider>
          {this.state.page === 'onboarding-add-account' && (
            <OnboardingAddAccountPage
              onOpenChooseLanguage={this.handleOpenOnboardingChooseLanguagePage}
              onOpenNewAccount={this.handleOpenOnboardingNewAccountPage}
              onOpenExistingAccount={this.handleOpenOnboardingExistingAccountPage}
            />
          )}
          {this.state.page === 'onboarding-choose-language' && (
            <OnboardingChooseLanguagePage
              onLanguageSelected={this.handleLanguageSelected}
            />
          )}
          {this.state.page === 'onboarding-new-account' && (
            <OnboardingNewAccountPage
              onGoBack={this.handleOpenOnboardingAddAccountPage}
              onGenerateMnemonic={this.handleOpenOnboardingSecurityNoticePage}
            />
          )}
          {this.state.page === 'onboarding-security-notice' && (
            <OnboardingSecurityNoticePage
              onClose={this.handleOpenOnboardingNewAccountPage}
              onContinue={this.handleOpenOnboardingNewMnemonicPage}
            />
          )}
          {this.state.page === 'onboarding-new-mnemonic' && !!this.state.mnemonic && (
            <OnboardingNewMnemonicPage
              mnemonic={this.state.mnemonic}
              onClose={this.handleOpenOnboardingNewAccountPage}
              onVerifyMnemonic={this.handleOpenOnboardingVerifyMnemonicPage}
            />
          )}
          {this.state.page === 'onboarding-verify-mnemonic' && !!this.state.mnemonic && (
            <OnboardingVerifyMnemonicPage
              mnemonic={this.state.mnemonic}
              onClose={this.handleOpenOnboardingNewAccountPage}
              onMnemonicVerified={this.handleOpenOnboardingAccountCreatedPage}
            />
          )}
          {this.state.page === 'onboarding-account-created' && !!this.state.address && (
            <OnboardingAccountCreatedPage
              accountAddress={this.state.address}
              onOpenOverview={this.handleOpenOnboardingAddAccountPage}
            />
          )}
          {this.state.page === 'onboarding-existing-account' && (
            <OnboardingExistingAccountPage
              accountAddress={this.state.address || ''}
              onGoBack={this.handleOpenOnboardingAddAccountPage}
              onAddressEntered={this.handleOpenOnboardingExistingAccountTypePage}
            />
          )}
          {this.state.page === 'onboarding-existing-account-type' && (
            <OnboardingExistingAccountTypePage
              onGoBack={this.handleOpenOnboardingExistingAccountPage}
              onFullAccessSelected={this.handleOpenOnboardingAddAccountPage}
              onReadAccessSelected={this.handleOpenOnboardingAddAccountPage}
            />
          )}
        </ThemeProvider>
      </IntlProvider>
    );
  }
}

export default App;
