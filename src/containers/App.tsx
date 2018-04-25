import * as React from 'react';
import OnboardingAddAccountPage from '../containers/OnboardingAddAccountPage';
import OnboardingChooseLanguagePage from '../containers/OnboardingChooseLanguagePage';
import OnboardingNewAccountPage from '../containers/OnboardingNewAccountPage';

class App extends React.Component {
  render() {
    let view = 'new-account';

    return (
      <React.Fragment>
        {view === 'add-account' && (
          <OnboardingAddAccountPage />
        )}
        {view === 'choose-language' && (
          <OnboardingChooseLanguagePage />
        )}
        {view === 'new-account' && (
          <OnboardingNewAccountPage />
        )}
      </React.Fragment>
    );
  }
}

export default App;
