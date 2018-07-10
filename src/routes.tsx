import * as React from 'react';
import { Route } from 'mobx-router';
import AsyncComponent from './components/AsyncComponent';
import Store from './stores/store';

type TOnboardingComponents = typeof import ('./containers/onboarding');
type TWalletComponents = typeof import ('./containers/wallet');

export const onboardingAddAccountRoute = new Route<Store>({
  path: '/onboarding/add-account',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.AddAccountPage />
        </components.Onboarding>
      )}
    />
  )
});

export const homeRoute = new Route<Store>({
  path: '/',
  onEnter: (route: Route<Store>, params: {}, store: Store) => {
    store.router.goTo(onboardingAddAccountRoute);
  }
});

export const onboardingChooseLanguageRoute = new Route<Store>({
  path: '/onboarding/choose-language',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.ChooseLanguagePage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingExistingAccountRoute = new Route<Store>({
  path: '/onboarding/existing-account',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.ExistingAccountPage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingExistingAccountTypeRoute = new Route<Store>({
  path: '/onboarding/existing-account-type',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.ExistingAccountTypePage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingNewAccountRoute = new Route<Store>({
  path: '/onboarding/new-account',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.NewAccountPage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingNewMnemonicsRoute = new Route<Store>({
  path: '/onboarding/new-mnemonic',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.NewMnemonicPage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingVerifyMnemonicsRoute = new Route<Store>({
  path: '/onboarding/verify-mnemonic',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.VerifyMnemonicPage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingAccountCreatedRoute = new Route<Store>({
  path: '/onboarding/account-created',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.AccountCreatedPage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingSecurityNoticeRoute = new Route<Store>({
  path: '/onboarding/security-notice',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.SecurityNoticePage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingNewMnemonicRoute = new Route<Store>({
  path: '/onboarding/new-mnemonic',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
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
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AccountOverview />
        </components.Wallet>
      )}
    />
  )
});
