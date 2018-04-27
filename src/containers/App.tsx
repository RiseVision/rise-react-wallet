import * as React from 'react';
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
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      page: 'onboarding-verify-mnemonic',
    };
  }

  handleOpenOnboardinChooseLanguagePage = () => {
    this.setState({ page: 'onboarding-choose-language' });
  }

  handleOpenOnboardingAddAccountPage = () => {
    this.setState({ page: 'onboarding-add-account' });
  }

  handleOpenOnboardingNewAccountPage = () => {
    this.setState({ page: 'onboarding-new-account' });
  }

  handleOpenOnboardingSecurityNoticePage = () => {
    this.setState({ page: 'onboarding-security-notice' });
  }

  handleOpenOnboardingNewMnemonicPage = () => {
    this.setState({ page: 'onboarding-new-mnemonic' });
  }

  handleOpenOnboardingVerifyMnemonicPage = () => {
    this.setState({ page: 'onboarding-verify-mnemonic' });
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
            onGoBack={this.handleOpenOnboardingNewAccountPage}
            onContinue={this.handleOpenOnboardingNewMnemonicPage}
          />
        )}
        {this.state.page === 'onboarding-new-mnemonic' && (
          <OnboardingNewMnemonicPage
            onGoBack={this.handleOpenOnboardingNewAccountPage}
            onVerifyMnemonic={this.handleOpenOnboardingVerifyMnemonicPage}
          />
        )}
        {this.state.page === 'onboarding-verify-mnemonic' && (
          <OnboardingVerifyMnemonicPage
            onGoBack={this.handleOpenOnboardingNewMnemonicPage}
          />
        )}
      </React.Fragment>
    );
  }
}

export default App;
