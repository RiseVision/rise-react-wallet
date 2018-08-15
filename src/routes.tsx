import { Route } from 'mobx-router';
import * as React from 'react';
import AsyncComponent from './components/AsyncComponent';
import RootStore from './stores/root';

type TOnboardingComponents = typeof import ('./containers/onboarding');
type TWalletComponents = typeof import ('./containers/wallet');

export const onboardingAddAccountRoute = new Route<RootStore>({
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

export const onboardingChooseLanguageRoute = new Route<RootStore>({
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

export const onboardingExistingAccountRoute = new Route<RootStore>({
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

export const onboardingExistingAccountTypeRoute = new Route<RootStore>({
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

export const onboardingNoMnemonicNoticeRoute = new Route<RootStore>({
  path: '/onboarding/no-mnemonic-notice',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
      resolve={() => import('./containers/onboarding')}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.NoMnemonicNoticePage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingNewAccountRoute = new Route<RootStore>({
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

export const onboardingNewMnemonicsRoute = new Route<RootStore>({
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

export const onboardingVerifyMnemonicsRoute = new Route<RootStore>({
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

export const onboardingAccountCreatedRoute = new Route<RootStore>({
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

export const onboardingSecurityNoticeRoute = new Route<RootStore>({
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

export const onboardingNewMnemonicRoute = new Route<RootStore>({
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

export const accountSettingsRoute = new Route({
  path: '/wallet/settings',
  component: (
    <AsyncComponent
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AccountSettings />
        </components.Wallet>
      )}
    />
  )
});

// TODO support From and To as query params
//   ?from=123R&to=456R
export const accountSendRoute = new Route({
  path: '/wallet/send',
  component: (
    <AsyncComponent
      name="./containers/wallet/send"
      resolve={() => {
        return import('./containers/wallet');
      }}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AccountOverview />
          <components.SendTransaction />
        </components.Wallet>
      )}
    />
  )
});

export const homeRoute = new Route<RootStore>({
  path: '/',
  onEnter: (route: Route<RootStore>, params: {}, store: RootStore) => {
    const walletStore = store.wallet;
    if (walletStore && !walletStore.storedAccounts()) {
      store.router.goTo(onboardingAddAccountRoute);
    } else {
      store.router.goTo(accountOverviewRoute);
    }
  }
});
