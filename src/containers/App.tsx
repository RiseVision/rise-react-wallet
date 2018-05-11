import * as React from 'react';
import * as bip39 from 'bip39';
import { LiskWallet } from 'dpos-offline';
import OnboardingAddAccountPage from '../containers/OnboardingAddAccountPage';
import OnboardingChooseLanguagePage from '../containers/OnboardingChooseLanguagePage';
import OnboardingNewAccountPage from '../containers/OnboardingNewAccountPage';
import OnboardingSecurityNoticePage from '../containers/OnboardingSecurityNoticePage';
import OnboardingNewMnemonicPage from '../containers/OnboardingNewMnemonicPage';
import OnboardingVerifyMnemonicPage from '../containers/OnboardingVerifyMnemonicPage';
import OnboardingAccountCreatedPage from '../containers/OnboardingAccountCreatedPage';
import OnboardingExistingAccountPage from '../containers/OnboardingExistingAccountPage';

interface Props {
}

interface State {
  page: string;
  mnemonic: string[] | null;
  address: string | null;
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
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

  handleOpenOnboardingAddAccountPage = () => {
    this.setState({
      page: 'onboarding-add-account',
      mnemonic: null,
    });
  }

  handleOpenOnboardingNewAccountPage = () => {
    this.setState({
      page: 'onboarding-new-account',
      mnemonic: null,
    });
  }

  handleOpenOnboardingSecurityNoticePage = () => {
    this.setState({
      page: 'onboarding-security-notice',
      mnemonic: null,
    });
  }

  handleOpenOnboardingNewMnemonicPage = () => {
    this.setState({
      page: 'onboarding-new-mnemonic',
      mnemonic: this.newMnemonic(),
    });
  }

  handleOpenOnboardingVerifyMnemonicPage = () => {
    this.setState((prevState) => {
      if (prevState.mnemonic) {
        return {
          page: 'onboarding-verify-mnemonic',
          mnemonic: prevState.mnemonic,
        };
      } else {
        return {
          page: 'onboarding-new-mnemonic',
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
      address: null,
    });
  }

  render() {
    return (
      <React.Fragment>
        {this.state.page === 'onboarding-add-account' && (
          <OnboardingAddAccountPage
            onOpenChooseLanguage={this.handleOpenOnboardingChooseLanguagePage}
            onOpenNewAccount={this.handleOpenOnboardingNewAccountPage}
            onOpenExistingAccount={this.handleOpenOnboardingExistingAccountPage}
          />
        )}
        {this.state.page === 'onboarding-choose-language' && (
          <OnboardingChooseLanguagePage
            onLanguageSelected={this.handleOpenOnboardingAddAccountPage}
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
            onGoBack={this.handleOpenOnboardingAddAccountPage}
            onAddressEntered={this.handleOpenOnboardingAddAccountPage}
          />
        )}
      </React.Fragment>
    );
  }
}

export default App;
