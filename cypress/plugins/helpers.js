import lstore from 'store';

const SEC = 1000;

export function getDialog(child = '', timeout = undefined) {
  return cy.get(`div[role="dialog"] ${child}`, { timeout });
}

export function getDialogContent() {
  // TODO should query a form element
  return getDialog('> div:nth-child(2) > div:nth-child(2)');
}

export function getDialogHeader() {
  return getDialog('> div:nth-child(2) > div:nth-child(1)');
}

export function getDialogInput(pos = 0) {
  return getDialog()
    .find('input')
    .eq(pos);
}

export function fillDialogInput(pos, text) {
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
export function clickDialogButton(pos = 0, force = false) {
  return getDialog()
    .find('button')
    .eq(pos)
    .click({ force });
}

export function fillConfirmationDialog(mnemonic, passphrase) {
  // use first account's secrets as defaults
  if (!mnemonic && !passphrase) {
    mnemonic = getSecrets(0).mnemonic;
    passphrase = getSecrets(0).passphrase;
  }
  // type in the mnemonic
  const first = fillDialogInput(0, mnemonic);
  // in case the password isnt set
  if (!passphrase) {
    return first;
  }
  // type in the passphrase and the Enter key
  return fillDialogInput(1, passphrase + '{enter}');
}

export function goToSettings() {
  // click the Settings button
  return cy.get('button[title="Account settings"]').click();
}

export function clickSettingsRow(text) {
  return cy
    .get('main')
    .find('span')
    .contains(text)
    .click();
}

export function assertAutofocus(tagName = 'input', timeout = 100) {
  return cy.focused({ timeout }).should('match', tagName);
}

export function closeDialog() {
  return getDialog()
    .find('button[aria-label="Close dialog"]')
    .click();
}

/**
 * Returns an account object from localStorage.
 * @param idOrPos Account ID or position in JSON (changes on every save).
 *   No parameter return the currently selected account.
 */
export function getAccount(idOrPos) {
  if (idOrPos === undefined) {
    idOrPos = lstore.get('lastSelectedAccount');
  }
  if (typeof idOrPos === 'number') {
    return lstore.get('accounts')[idOrPos];
  }
  return lstore.get('accounts').find(a => a.id === idOrPos);
}

/**
 * Returns a secrets object from fixtures.
 * @param idOrPos Account ID or position on JSON (doesn't change).
 *   No parameter return secrets for the currently selected account.
 */
export function getSecrets(idOrPos) {
  if (!idOrPos) {
    idOrPos = lstore.get('lastSelectedAccount');
  }
  if (typeof idOrPos === 'number') {
    return lstore.get('secrets')[idOrPos];
  }
  return lstore.get('secrets').find(a => a.id === idOrPos);
}

export function assertSuccessfulDialog() {
  // wait 10 secs for the successful dialog
  getDialog('', 10 * SEC)
    .contains('span', 'successfully')
    .should('have.length', 1);
}

/**
 * Selects an account from the menu
 * @param id
 */
export function selectAccount(id) {
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
