import * as lstore from 'store';

const SEC = 1000;

export type TSecret = {
  id: string;
  mnemonic: string;
  passphrase?: string;
};

export type TStoredAccount = {
  id: string;
  publicKey: string;
  readOnly: boolean;
  fiatCurrency: string;
  name: string | null;
  pinned: boolean;
};

export function getDialog(child: string = '', timeout?: number) {
  return cy.get(`div[role="dialog"] ${child}`, { timeout });
}

export function getDialogContent() {
  // TODO should query a form element
  return getDialog('> div:nth-child(2) > div:nth-child(2)');
}

export function getDialogHeader() {
  return getDialog('> div:nth-child(2) > div:nth-child(1)');
}

export function getDialogInput(pos: number = 0) {
  return getDialog()
    .find('input')
    .eq(pos);
}

export function fillDialogInput(pos: number = 0, text: string) {
  return getDialogInput(pos).type(text);
}

export function clickDialogSubmit() {
  return getDialog()
    .find('button[type="submit"]')
    .click();
}

/**
 * TODO support clicking by text
 * @param pos
 */
export function clickDialogButton(pos: number = 0, force = false) {
  return getDialog()
    .find('button')
    .eq(pos)
    .click({ force });
}

export function fillConfirmationDialog(mnemonic?: string, passphrase?: string) {
  // use first account's secrets as defaults
  if (!mnemonic && !passphrase) {
    mnemonic = getSecrets(0).mnemonic;
    passphrase = getSecrets(0).passphrase;
  }
  // type in the mnemonic
  const first = fillDialogInput(0, mnemonic!);
  // in case the password isnt set
  if (!passphrase) {
    return first;
  }
  // type in the passphrase and the Enter key
  return fillDialogInput(1, passphrase + '{enter}');
}

export function goToSettings() {
  // click the Settings button
  return cy.get('a[title="Account settings"]').click();
}

export function clickSettingsRow(text: string) {
  return cy
    .get('main')
    .find('span')
    .contains(text)
    .click();
}

export function assertAutofocus(
  tagName: string = 'input',
  timeout: number = 100
) {
  return cy.focused({ timeout }).should('match', tagName);
}

export function closeDialog() {
  return getDialog()
    .find('[aria-label="Close dialog"]')
    .click();
}

/**
 * Returns an account object from localStorage.
 * @param idOrPos Account ID or position in JSON (changes on every save).
 *   No parameter return the currently selected account.
 */
export function getAccount(idOrPos?: string | number) {
  if (idOrPos === undefined) {
    idOrPos = lstore.get('lastSelectedAccount');
  }
  if (typeof idOrPos === 'number') {
    return lstore.get('accounts')[idOrPos];
  }
  return lstore.get('accounts').find((a: TStoredAccount) => a.id === idOrPos);
}

/**
 * Returns a secrets object from fixtures.
 * @param idOrPos Account ID or position on JSON (doesn't change).
 *   No parameter return secrets for the currently selected account.
 */
export function getSecrets(idOrPos?: string | number) {
  if (!idOrPos) {
    idOrPos = lstore.get('lastSelectedAccount');
  }
  if (typeof idOrPos === 'number') {
    return lstore.get('secrets')[idOrPos];
  }
  return lstore.get('secrets').find((a: TSecret) => a.id === idOrPos);
}

export function assertSuccessfulDialog() {
  // wait 10 secs for the successful dialog
  getDialog('', 10 * SEC)
    .contains('span', 'successfully')
    .should('have.length', 1);
}

export function assertUnsuccessfulDialog(msg: string) {
  // wait 10 secs for the successful dialog
  getDialog('', 10 * SEC)
    .contains('span', msg)
    .should('have.length', 1);
}

/**
 * Selects an account from the menu
 * @param id
 */
export function selectAccount(id: string) {
  cy.get('ul[aria-label="Accounts"]')
    .find('p')
    .contains(id)
    .click();
}

export function openRegisterDelegateDialog() {
  // wait for loading to complete
  cy.get('main')
    .find('p')
    .should('contain', 'Not registered');
  clickSettingsRow('Delegate registration');
}

/**
 * Returns the node with contains expanded transaction details on the account
 * overview page.
 */
export function getTransactionDetails() {
  return (
    cy
      .get('main aside + div > div:nth-child(2)')
      .find('div[aria-expanded="true"][role="button"]')
      .eq(0)
      // move to the expanded panel
      .next()
  );
}

/**
 * Click on a transaction row on the account overview page.
 *
 * @param index 1-based index.
 */
export function expandTransactionDetails(index = 1) {
  return cy
    .get(`main aside + div > div:nth-child(${index})`)
    .find('div[aria-expanded="false"][role="button"]')
    .eq(0)
    .click();
}
