import * as React from 'react';
import * as bip39 from 'bip39';
import OnboardingAddAccountPage from '../containers/OnboardingAddAccountPage';
import OnboardingChooseLanguagePage from '../containers/OnboardingChooseLanguagePage';
import OnboardingNewAccountPage from '../containers/OnboardingNewAccountPage';
import OnboardingSecurityNoticePage from '../containers/OnboardingSecurityNoticePage';
import OnboardingNewMnemonicPage from '../containers/OnboardingNewMnemonicPage';
import OnboardingVerifyMnemonicPage from '../containers/OnboardingVerifyMnemonicPage';

interface Props {
}

interface State {
  page: string;
  mnemonic: string[] | null;
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      page: 'onboarding-new-mnemonic',
      mnemonic: this.newMnemonic(),
    };
  }

  newMnemonic(): string[] {
    return bip39.generateMnemonic().split(' ');
  }

  handleOpenOnboardinChooseLanguagePage = () => {
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

  render() {
    return (
      <React.Fragment>
        {this.state.page === 'onboarding-add-account' && (
          <OnboardingAddAccountPage
            onOpenChooseLanguage={this.handleOpenOnboardinChooseLanguagePage}
            onOpenNewAccount={this.handleOpenOnboardingNewAccountPage}
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
            onMnemonicVerified={this.handleOpenOnboardingNewAccountPage}
          />
        )}
      </React.Fragment>
    );
  }
}

export default App;
