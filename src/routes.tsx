import { Route, RouteParams } from 'mobx-router-rise';
import * as React from 'react';
import * as lstore from 'store';
import AsyncComponent from './components/AsyncComponent';
import LoadingIndicator from './components/LoadingIndicator';
import RootStore from './stores/root';
import { TStoredAccount } from './stores/wallet';

type TOnboardingComponents = typeof import ('./containers/onboarding');
type TWalletComponents = typeof import ('./containers/wallet');

function createNoIDRoute(
  path: string,
  target: Route<RootStore>
): Route<RootStore> {
  return new Route({
    path,
    onEnter: function(
      route: Route<RootStore>,
      params: { id?: string },
      store: RootStore,
      queryParams: {}
    ) {
      if (!redirWhenNoAccounts(route, params, store)) {
        const id = store.wallet.selectedAccount.id;
        store.router.goTo(target, { id }, store, queryParams);
      }
    }
  });
}

// onboarding

export const onboardingAddAccountRoute = new Route<RootStore>({
  path: '/onboarding/add-account',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
      resolve={() => import('./containers/onboarding')}
      loading={<LoadingIndicator />}
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
      loading={<LoadingIndicator />}
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
      loading={<LoadingIndicator />}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.ExistingAccountPage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingMnemonicAccountRoute = new Route<RootStore>({
  path: '/onboarding/mnemonic-account',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
      resolve={() => import('./containers/onboarding')}
      loading={<LoadingIndicator />}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.MnemonicAccountPage />
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
      loading={<LoadingIndicator />}
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
      loading={<LoadingIndicator />}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.NoMnemonicNoticePage />
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
      loading={<LoadingIndicator />}
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
      loading={<LoadingIndicator />}
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
      loading={<LoadingIndicator />}
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
      loading={<LoadingIndicator />}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.SecurityNoticePage />
        </components.Onboarding>
      )}
    />
  )
});

export const onboardingLedgerAccount = new Route<RootStore>({
  path: '/onboarding/import-ledger',
  component: (
    <AsyncComponent
      name="./containers/onboarding"
      resolve={() => import('./containers/onboarding')}
      loading={<LoadingIndicator />}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.LedgerAccountPage />
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
      loading={<LoadingIndicator />}
      render={(components: TOnboardingComponents) => (
        <components.Onboarding>
          <components.NewMnemonicPage />
        </components.Onboarding>
      )}
    />
  )
});

// wallet

export const accountOverviewRoute = new Route({
  path: '/account/:id',
  onEnter: onEnterID,
  onParamsChange(
    route: Route<RootStore>,
    params: RouteParams,
    store: RootStore
  ) {
    store.wallet.selectAccount(params.id);
    // pass async
    store.wallet.refreshAccount(params.id);
  },
  component: (
    <AsyncComponent
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      loading={<LoadingIndicator />}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AccountOverview />
        </components.Wallet>
      )}
    />
  )
});

export const accountOverviewNoIDRoute = createNoIDRoute(
  '/account',
  accountOverviewRoute
);

function redirWhenNoAccounts(
  route: Route<RootStore>,
  params: { id?: string },
  store: RootStore
) {
  const accounts = lstore.get('accounts');
  if (!accounts || !accounts.length) {
    store.router.goTo(onboardingAddAccountRoute);
    return true;
  }
  return false;
}

function idFromURL(
  route: Route<RootStore>,
  params: { id: string },
  store: RootStore,
  urlParams: {}
) {
  const id = params.id;
  const accounts = lstore.get('accounts');
  // make the ID from the URL as a selected account (if exists)
  if (accounts.find((a: TStoredAccount) => a.id === id)) {
    // has to be done here, as RouterStore isnt fully initialized during
    // WalletStore.constructor
    store.wallet.selectAccount(id);
  } else {
    // or redirect to the last selected to update the URL
    store.router.goTo(
      accountOverviewRoute,
      {
        id: lstore.get('lastSelectedAccount')
      },
      null,
      urlParams
    );
  }
}

function onEnterID(
  route: Route<RootStore>,
  params: { id: string },
  store: RootStore,
  queryParams: {}
) {
  if (!redirWhenNoAccounts(route, params, store)) {
    idFromURL(route, params, store, queryParams);
  }
}

// settings

export const accountSettingsNameRoute = new Route({
  path: '/settings/name/:id',
  onEnter: onEnterID,
  component: (
    <AsyncComponent
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      loading={<LoadingIndicator />}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AccountSettings />
        </components.Wallet>
      )}
    />
  )
});

export const accountSettingsNameNoIDRoute = createNoIDRoute(
  '/settings/name',
  accountSettingsNameRoute
);

export const accountSettingsVoteRoute = new Route({
  path: '/settings/vote/:id',
  onEnter: onEnterID,
  component: (
    <AsyncComponent
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      loading={<LoadingIndicator />}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AccountSettings />
        </components.Wallet>
      )}
    />
  )
});

export const accountSettingsVoteNoIDRoute = createNoIDRoute(
  '/settings/vote',
  accountSettingsVoteRoute
);

export const accountSettingsFiatRoute = new Route({
  path: '/settings/fiat/:id',
  onEnter: onEnterID,
  component: (
    <AsyncComponent
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      loading={<LoadingIndicator />}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AccountSettings />
        </components.Wallet>
      )}
    />
  )
});

export const accountSettingsFiatNoIDRoute = createNoIDRoute(
  '/settings/fiat',
  accountSettingsFiatRoute
);

export const accountSettingsPassphraseRoute = new Route({
  path: '/settings/passphrase/:id',
  onEnter: onEnterID,
  component: (
    <AsyncComponent
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      loading={<LoadingIndicator />}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AccountSettings />
        </components.Wallet>
      )}
    />
  )
});

export const accountSettingsPassphraseNoIDRoute = createNoIDRoute(
  '/settings/passphrase',
  accountSettingsPassphraseRoute
);

export const accountSettingsDelegateRoute = new Route({
  path: '/settings/delegate/:id',
  onEnter: onEnterID,
  component: (
    <AsyncComponent
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      loading={<LoadingIndicator />}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AccountSettings />
        </components.Wallet>
      )}
    />
  )
});

export const accountSettingsDelegateNoIDRoute = createNoIDRoute(
  '/settings/delegate',
  accountSettingsDelegateRoute
);

export const accountSettingsRemoveRoute = new Route({
  path: '/settings/remove/:id',
  onEnter: onEnterID,
  component: (
    <AsyncComponent
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      loading={<LoadingIndicator />}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AccountSettings />
        </components.Wallet>
      )}
    />
  )
});

export const accountSettingsRemoveNoIDRoute = createNoIDRoute(
  '/settings/remove',
  accountSettingsRemoveRoute
);

export const accountSettingsRoute = new Route({
  path: '/settings/:id',
  onEnter: onEnterID,
  component: (
    <AsyncComponent
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      loading={<LoadingIndicator />}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AccountSettings />
        </components.Wallet>
      )}
    />
  )
});

export const accountSettingsNoIDRoute = createNoIDRoute(
  '/settings',
  accountSettingsRoute
);

// send form

// accepts &to=1232R&amount=0.1
export const accountSendRoute = new Route({
  path: '/send/:id',
  onEnter: onEnterID,
  component: (
    <AsyncComponent
      name="./containers/wallet/send"
      resolve={() => {
        return import('./containers/wallet');
      }}
      loading={<LoadingIndicator />}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AccountOverview />
        </components.Wallet>
      )}
    />
  )
});

export const accountSendNoIDRoute = createNoIDRoute('/send', accountSendRoute);

export const addressBookRoute = new Route({
  path: '/address-book',
  onEnter: redirWhenNoAccounts,
  component: (
    <AsyncComponent
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      loading={<LoadingIndicator />}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AddressBook />
        </components.Wallet>
      )}
    />
  )
});

export const addressBookCreateRoute = new Route({
  path: '/address-book/create',
  component: (
    <AsyncComponent
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      loading={<LoadingIndicator />}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AddressBook />
        </components.Wallet>
      )}
    />
  )
});

export const addressBookModifyRoute = new Route({
  path: '/address-book/modify/:id',
  component: (
    <AsyncComponent
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      loading={<LoadingIndicator />}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AddressBook />
        </components.Wallet>
      )}
    />
  )
});

export const addressBookRemoveRoute = new Route({
  path: '/address-book/remove/:id',
  component: (
    <AsyncComponent
      name="./containers/wallet"
      resolve={() => {
        return import('./containers/wallet');
      }}
      loading={<LoadingIndicator />}
      render={(components: TWalletComponents) => (
        <components.Wallet>
          <components.AddressBook />
        </components.Wallet>
      )}
    />
  )
});

export const homeRoute = new Route<RootStore>({
  path: '/',
  onEnter: (route: Route<RootStore>, params: {}, store: RootStore) => {
    const walletStore = store.wallet;
    if (walletStore && !walletStore.storedAccounts().length) {
      store.router.goTo(onboardingAddAccountRoute);
    } else {
      const id = walletStore.selectedAccount.id;
      store.router.goTo(accountOverviewRoute, { id });
    }
  }
});
