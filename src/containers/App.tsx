import * as React from 'react';
import OnboardingAddAccountPage from '../containers/OnboardingAddAccountPage';
import OnboardingChooseLanguagePage from '../containers/OnboardingChooseLanguagePage';
import OnboardingNewAccountPage from '../containers/OnboardingNewAccountPage';

interface Props {
}

interface State {
  page: string;
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      page: 'onboarding-add-account',
    };

    this.handleOpenOnboardinChooseLanguagePage = this.handleOpenOnboardinChooseLanguagePage.bind(this);
    this.handleOpenOnboardingAddAccountPage = this.handleOpenOnboardingAddAccountPage.bind(this);
    this.handleOpenOnboardingNewAccountPage = this.handleOpenOnboardingNewAccountPage.bind(this);
  }

  handleOpenOnboardinChooseLanguagePage() {
    this.setState({ page: 'onboarding-choose-language' });
  }

  handleOpenOnboardingAddAccountPage() {
    this.setState({ page: 'onboarding-add-account' });
  }

  handleOpenOnboardingNewAccountPage() {
    this.setState({ page: 'onboarding-new-account' });
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
          />
        )}
      </React.Fragment>
    );
  }
}

export default App;
