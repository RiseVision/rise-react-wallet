import * as React from 'react';
import ModalBackdrop from './components/ModalBackdrop';
import { Route } from 'mobx-router';
// components
import OnboardingAddAccountPage from './containers/OnboardingAddAccountPage';
import OnboardingChooseLanguagePage from './containers/OnboardingChooseLanguagePage';
import OnboardingExistingAccountPage from './containers/OnboardingExistingAccountPage';
import OnboardingExistingAccountTypePage from './containers/OnboardingExistingAccountTypePage';
import OnboardingNewAccountPage from './containers/OnboardingNewAccountPage';
import OnboardingSecurityNoticePage from './containers/OnboardingSecurityNoticePage';
import Store from './store';
// import Wallet from "./containers/Wallet";

export const onboardingAddAccountRoute = new Route<Store>({
  path: '/onboarding/add-account',
  component: (
    <React.Fragment>
      <ModalBackdrop open={true} transitionDuration={0} />
      <OnboardingAddAccountPage />
    </React.Fragment>
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
    <React.Fragment>
      <ModalBackdrop open={true} transitionDuration={0} />
      <OnboardingChooseLanguagePage />
    </React.Fragment>
  )
});

export const onboardingExistingAccountRoute = new Route<Store>({
  path: '/onboarding/existing-account',
  component: (
    <React.Fragment>
      <ModalBackdrop open={true} transitionDuration={0} />
      <OnboardingExistingAccountPage accountAddress={'test test test'} />
    </React.Fragment>
  )
});

export const onboardingExistingAccountTypeRoute = new Route<Store>({
  path: '/onboarding/existing-account-type',
  component: (
    <React.Fragment>
      <ModalBackdrop open={true} transitionDuration={0} />
      <OnboardingExistingAccountTypePage />
    </React.Fragment>
  )
});

export const onboardingNewAccountRoute = new Route<Store>({
  path: '/onboarding/new-account',
  component: (
    <React.Fragment>
      <ModalBackdrop open={true} transitionDuration={0} />
      <OnboardingNewAccountPage />
    </React.Fragment>
  )
});

export const onboardingSecurityNoticeRoute = new Route<Store>({
  path: '/onboarding/security-notice',
  component: (
    <React.Fragment>
      <ModalBackdrop open={true} transitionDuration={0} />
      <OnboardingSecurityNoticePage />
    </React.Fragment>
  )
});

export const onboardingNewMnemonicRoute = new Route<Store>({
  path: '/onboarding/new-mnemonic',
  component: (
    <React.Fragment>
      <ModalBackdrop open={true} transitionDuration={0} />
      <OnboardingSecurityNoticePage />
    </React.Fragment>
  )
});

// wallet: new Route({
//   path: "/wallet",
//   // @ts-ignore
//   component: <Wallet />,
// })
