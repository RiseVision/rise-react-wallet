import * as React from 'react';
import ModalBackdrop from './components/ModalBackdrop';
import { Route } from 'mobx-router';
// components
import OnboardingAddAccountPage from './containers/OnboardingAddAccountPage';
import OnboardingChooseLanguagePage from './containers/OnboardingChooseLanguagePage';
import OnboardingExistingAccountPage from './containers/OnboardingExistingAccountPage';
import OnboardingNewAccountPage from './containers/OnboardingNewAccountPage';
import OnboardingSecurityNoticePage from './containers/OnboardingSecurityNoticePage';
// import Wallet from "./containers/Wallet";

export const onboardingAddAccountRoute = new Route({
  path: '/onboarding/add-account',
  component: (
    <React.Fragment>
      <ModalBackdrop open={true} transitionDuration={0} />
      <OnboardingAddAccountPage />
    </React.Fragment>
  )
});

export const homeRoute = new Route({
  path: '/',
  onEnter: (route, params, store, queryParams) => {
    store.router.goTo(onboardingAddAccountRoute);
  }
});

export const onboardingChooseLanguageRoute = new Route({
  path: '/onboarding/choose-language',
  component: (
    <React.Fragment>
      <ModalBackdrop open={true} transitionDuration={0} />
      <OnboardingChooseLanguagePage />
    </React.Fragment>
  )
});

export const onboardingExistingAccountRoute = new Route({
  path: '/onboarding/existing-account'
  // component: (
  //   <React.Fragment>
  //     <ModalBackdrop open={true} transitionDuration={0} />
  //     // @ts-ignore
  //     <OnboardingExistingAccountPage/>
  //   </React.Fragment>
  // )
});

export const onboardingNewAccountRoute = new Route({
  path: '/onboarding/new-account',
  component: (
    <React.Fragment>
      <ModalBackdrop open={true} transitionDuration={0} />
      <OnboardingNewAccountPage />
    </React.Fragment>
  )
});

export const onboardingSecurityNoticeRoute = new Route({
  path: '/onboarding/security-notice',
  component: (
    <React.Fragment>
      <ModalBackdrop open={true} transitionDuration={0} />
      <OnboardingSecurityNoticePage />
    </React.Fragment>
  )
});

export const onboardingNewMnemonicRoute = new Route({
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
