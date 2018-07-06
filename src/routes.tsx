import * as React from 'react';
import { Route } from 'mobx-router';
import AccountOverview from './containers/AccountOverview';
import Store from './store';
// components
import OnboardingAccountCreatedPage from './containers/OnboardingAccountCreatedPage';
import Onboarding from './containers/Onboarding';
import OnboardingAddAccountPage from './containers/OnboardingAddAccountPage';
import OnboardingChooseLanguagePage from './containers/OnboardingChooseLanguagePage';
import OnboardingExistingAccountPage from './containers/OnboardingExistingAccountPage';
import OnboardingExistingAccountTypePage from './containers/OnboardingExistingAccountTypePage';
import OnboardingNewAccountPage from './containers/OnboardingNewAccountPage';
import OnboardingNewMnemonicPage from './containers/OnboardingNewMnemonicPage';
import OnboardingSecurityNoticePage from './containers/OnboardingSecurityNoticePage';
import OnboardingVerifyMnemonicPage from './containers/OnboardingVerifyMnemonicPage';
import Wallet from './containers/Wallet';

export const onboardingAddAccountRoute = new Route<Store>({
  path: '/onboarding/add-account',
  component: (
    <Onboarding>
      <OnboardingAddAccountPage />
    </Onboarding>
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
    <Onboarding>
      <OnboardingChooseLanguagePage />
    </Onboarding>
  )
});

export const onboardingExistingAccountRoute = new Route<Store>({
  path: '/onboarding/existing-account',
  component: (
    <Onboarding>
      <OnboardingExistingAccountPage />
    </Onboarding>
  )
});

export const onboardingExistingAccountTypeRoute = new Route<Store>({
  path: '/onboarding/existing-account-type',
  component: (
    <Onboarding>
      <OnboardingExistingAccountTypePage />
    </Onboarding>
  )
});

export const onboardingNewAccountRoute = new Route<Store>({
  path: '/onboarding/new-account',
  component: (
    <Onboarding>
      <OnboardingNewAccountPage />
    </Onboarding>
  )
});

export const onboardingNewMnemonicsRoute = new Route<Store>({
  path: '/onboarding/new-mnemonic',
  component: (
    <Onboarding>
      <OnboardingNewMnemonicPage />
    </Onboarding>
  )
});

export const onboardingVerifyMnemonicsRoute = new Route<Store>({
  path: '/onboarding/verify-mnemonic',
  component: (
    <Onboarding>
      <OnboardingVerifyMnemonicPage />
    </Onboarding>
  )
});

export const onboardingAccountCreatedRoute = new Route<Store>({
  path: '/onboarding/account-created',
  component: (
    <Onboarding>
      <OnboardingAccountCreatedPage />
    </Onboarding>
  )
});

export const onboardingSecurityNoticeRoute = new Route<Store>({
  path: '/onboarding/security-notice',
  component: (
    <Onboarding>
      <OnboardingSecurityNoticePage />
    </Onboarding>
  )
});

export const onboardingNewMnemonicRoute = new Route<Store>({
  path: '/onboarding/new-mnemonic',
  component: (
    <Onboarding>
      <OnboardingNewMnemonicPage />
    </Onboarding>
  )
});

export const accountOverviewRoute = new Route({
  path: '/wallet',
  component: (
    <Wallet>
      <AccountOverview />
    </Wallet>
  )
});
