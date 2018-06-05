import * as React from 'react';
import * as bip39 from 'bip39';
import { LiskWallet } from 'dpos-offline';
import { Locale } from '../utils/i18n';
import OnboardingAddAccountPage from './OnboardingAddAccountPage';
import OnboardingChooseLanguagePage from './OnboardingChooseLanguagePage';
import OnboardingNewAccountPage from './OnboardingNewAccountPage';
import OnboardingSecurityNoticePage from './OnboardingSecurityNoticePage';
import OnboardingNewMnemonicPage from './OnboardingNewMnemonicPage';
import OnboardingVerifyMnemonicPage from './OnboardingVerifyMnemonicPage';
import OnboardingAccountCreatedPage from './OnboardingAccountCreatedPage';
import OnboardingExistingAccountPage from './OnboardingExistingAccountPage';
import OnboardingExistingAccountTypePage from './OnboardingExistingAccountTypePage';
import OnboardingTestOverPage from './OnboardingTestOverPage';

interface Props {
  locale: Locale;
  page: string;
  onPageChanged: (page: string) => void;
  onLocaleChanged: (locale: Locale) => void;
}

interface State {
  mnemonic: string[] | null;
  address: string | null;
}

function newMnemonic(): string[] {
  return bip39.generateMnemonic().split(' ');
}

class Onboarding extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      mnemonic: null,
      address: null,
    };
  }

  render() {
    const { locale, page } = this.props;

    return (
      <React.Fragment>
        <OnboardingAddAccountPage
          open={page === 'onboarding-add-account'}
          locale={locale}
          onOpenChooseLanguage={this.handleOpenOnboardingChooseLanguagePage}
          onOpenNewAccount={this.handleOpenOnboardingNewAccountPage}
          onOpenExistingAccount={this.handleOpenOnboardingExistingAccountPage}
        />
        <OnboardingChooseLanguagePage
          open={page === 'onboarding-choose-language'}
          onLanguageSelected={this.handleLanguageSelected}
        />
        <OnboardingNewAccountPage
          open={page === 'onboarding-new-account'}
          onGoBack={this.handleOpenOnboardingAddAccountPage}
          onGenerateMnemonic={this.handleOpenOnboardingSecurityNoticePage}
        />
        <OnboardingSecurityNoticePage
          open={page === 'onboarding-security-notice'}
          onClose={this.handleOpenOnboardingNewAccountPage}
          onContinue={this.handleOpenOnboardingNewMnemonicPage}
        />
        <OnboardingNewMnemonicPage
          open={page === 'onboarding-new-mnemonic' && !!this.state.mnemonic}
          mnemonic={this.state.mnemonic || ['<N/A>']}
          onClose={this.handleOpenOnboardingNewAccountPage}
          onVerifyMnemonic={this.handleOpenOnboardingVerifyMnemonicPage}
        />
        <OnboardingVerifyMnemonicPage
          open={page === 'onboarding-verify-mnemonic' && !!this.state.mnemonic}
          mnemonic={this.state.mnemonic || ['<N/A>']}
          onClose={this.handleOpenOnboardingNewAccountPage}
          onMnemonicVerified={this.handleOpenOnboardingAccountCreatedPage}
        />
        <OnboardingAccountCreatedPage
          open={page === 'onboarding-account-created' && !!this.state.address}
          accountAddress={this.state.address || '<N/A>'}
          onOpenOverview={this.handleOpenOnboardingTestOverPage}
        />
        <OnboardingExistingAccountPage
          open={page === 'onboarding-existing-account'}
          accountAddress={this.state.address || ''}
          onGoBack={this.handleOpenOnboardingAddAccountPage}
          onAddressEntered={this.handleOpenOnboardingExistingAccountTypePage}
        />
        <OnboardingExistingAccountTypePage
          open={page === 'onboarding-existing-account-type'}
          onGoBack={this.handleOpenOnboardingExistingAccountPage}
          onFullAccessSelected={this.handleOpenOnboardingTestOverPage}
          onReadAccessSelected={this.handleOpenOnboardingTestOverPage}
        />
        <OnboardingTestOverPage
          open={page === 'onboarding-test-over'}
          onGoHome={this.handleOpenOnboardingAddAccountPage}
        />
      </React.Fragment>
    );
  }

  handleOpenOnboardingChooseLanguagePage = () => {
    this.setState({
      mnemonic: null,
      address: null,
    });
    this.props.onPageChanged('onboarding-choose-language');
  }

  handleLanguageSelected = (locale: Locale) => {
    this.setState({
      mnemonic: null,
      address: null,
    });
    this.props.onLocaleChanged(locale);
    this.props.onPageChanged('onboarding-add-account');
  }

  handleOpenOnboardingAddAccountPage = () => {
    this.setState({
      mnemonic: null,
      address: null,
    });
    this.props.onPageChanged('onboarding-add-account');
  }

  handleOpenOnboardingNewAccountPage = () => {
    this.setState({
      mnemonic: null,
      address: null,
    });
    this.props.onPageChanged('onboarding-new-account');
  }

  handleOpenOnboardingSecurityNoticePage = () => {
    this.setState({
      mnemonic: null,
      address: null,
    });
    this.props.onPageChanged('onboarding-security-notice');
  }

  handleOpenOnboardingNewMnemonicPage = () => {
    this.setState({
      address: null,
      mnemonic: newMnemonic(),
    });
    this.props.onPageChanged('onboarding-new-mnemonic');
  }

  handleOpenOnboardingVerifyMnemonicPage = () => {
    this.setState({
      address: null,
    });
    this.props.onPageChanged('onboarding-verify-mnemonic');
  }

  handleOpenOnboardingAccountCreatedPage = () => {
    const { mnemonic } = this.state;
    if (mnemonic) {
      const wallet = new LiskWallet(mnemonic.join(' '), 'R');
      this.setState({
        address: wallet.address,
      });
      this.props.onPageChanged('onboarding-account-created');
    }
  }

  handleOpenOnboardingExistingAccountPage = () => {
    this.setState({
      mnemonic: null,
    });
    this.props.onPageChanged('onboarding-existing-account');
  }

  handleOpenOnboardingExistingAccountTypePage = (address: string) => {
    this.setState({
      address,
      mnemonic: null,
    });
    this.props.onPageChanged('onboarding-existing-account-type');
  }

  handleOpenOnboardingTestOverPage = () => {
    this.setState({
      mnemonic: null,
      address: null,
    });
    this.props.onPageChanged('onboarding-test-over');
  }
}

export default Onboarding;
