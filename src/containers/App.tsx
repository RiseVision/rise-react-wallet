import * as React from 'react';
import OnboardingAddAccountPage from '../containers/OnboardingAddAccountPage';
import OnboardingChooseLanguagePage from '../containers/OnboardingChooseLanguagePage';

class App extends React.Component {
  render() {
    let view = 'choose-language';

    return (
      <React.Fragment>
        {view === 'add-account' && (
          <OnboardingAddAccountPage />
        )}
        {view === 'choose-language' && (
          <OnboardingChooseLanguagePage />
        )}
      </React.Fragment>
    );
  }
}

export default App;
