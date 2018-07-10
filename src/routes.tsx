import * as React from 'react';
import { Route } from 'mobx-router';
import AsyncComponent from './components/AsyncComponent';
import App from './stores/app';

type TOnboardingComponents = typeof import ('./containers/onboarding');
type TWalletComponents = typeof import ('./containers/wallet');

export const onboardingAddAccountRoute = new Route<App>({
  path: '/onboarding/add-account',
  component: (
    <AsyncComponent
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.AddAccountPage />
        </components.Onboarding>
      )}
    />
  )
});

export const homeRoute = new Route<App>({
  path: '/',
  onEnter: (route: Route<App>, params: {}, store: App) => {
    store.router.goTo(onboardingAddAccountRoute);
  }
});

export const onboardingChooseLanguageRoute = new Route<App>({
  path: '/onboarding/choose-language',
  component: (
    <AsyncComponent
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.ChooseLanguagePage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingExistingAccountRoute = new Route<App>({
  path: '/onboarding/existing-account',
  component: (
    <AsyncComponent
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.ExistingAccountPage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingExistingAccountTypeRoute = new Route<App>({
  path: '/onboarding/existing-account-type',
  component: (
    <AsyncComponent
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.ExistingAccountTypePage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingNewAccountRoute = new Route<App>({
  path: '/onboarding/new-account',
  component: (
    <AsyncComponent
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.NewAccountPage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingNewMnemonicsRoute = new Route<App>({
  path: '/onboarding/new-mnemonic',
  component: (
    <AsyncComponent
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.NewMnemonicPage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingVerifyMnemonicsRoute = new Route<App>({
  path: '/onboarding/verify-mnemonic',
  component: (
    <AsyncComponent
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.VerifyMnemonicPage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingAccountCreatedRoute = new Route<App>({
  path: '/onboarding/account-created',
  component: (
    <AsyncComponent
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.AccountCreatedPage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingSecurityNoticeRoute = new Route<App>({
  path: '/onboarding/security-notice',
  component: (
    <AsyncComponent
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.SecurityNoticePage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingNewMnemonicRoute = new Route<App>({
  path: '/onboarding/new-mnemonic',
  component: (
    <AsyncComponent
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.NewMnemonicPage />
        </components.Onboarding>
      )}
    />
  )
});

export const accountOverviewRoute = new Route({
  path: '/wallet',
  component: (
    <AsyncComponent
      resolve={() => import('./containers/wallet')}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AccountOverview />
        </components.Wallet>
      )}
    />
  )
});
