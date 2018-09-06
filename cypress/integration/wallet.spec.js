/// <reference types="Cypress" />
import lstore from 'store';

// TODO move to helpers

function getDialog(child = '') {
  return cy.get(`div[role="dialog"] ${child}`);
}

function getDialogContent() {
  // TODO should query a form element
  return getDialog('> div:nth-child(2) > div:nth-child(2)');
}

function getDialogHeader() {
  return getDialog('> div:nth-child(2) > div:nth-child(1)');
}

function getDialogInput(pos = 0) {
  return getDialog()
    .find('input')
    .eq(pos);
}

function fillDialogInput(pos, text) {
  return getDialogInput(pos).type(text);
}

function clickDialogSubmit() {
  return getDialog()
    .find('button[type="submit"]')
    .click();
}

// TODO support clicking by text
function clickDialogButton(pos = 0) {
  return getDialog()
    .find('button')
    .eq(pos)
    .click();
}

function fillConfirmationDialog(mnemonic, passphrase) {
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

function goToSettings() {
  // click the Settings button
  return cy.get('button[title="Account settings"]').click();
}

function clickSettingsRow(text) {
  return cy
    .get('main')
    .find('span')
    .contains(text)
    .click();
}

function assertAutofocus() {
  return cy.focused().should('match', 'input');
}

function closeDialog() {
  return getDialog()
    .find('button[aria-label="Close dialog"]')
    .click();
}

function getAccount(idOrPos) {
  if (typeof idOrPos === 'number') {
    return lstore.get('accounts')[idOrPos];
  }
  return lstore.get('accounts').find(a => a.id === idOrPos);
}

function getSecrets(idOrPos) {
  if (typeof idOrPos === 'number') {
    return lstore.get('secrets')[idOrPos];
  }
  return lstore.get('secrets').find(a => a.id === idOrPos);
}

function assertSuccessfulDialog() {
  getDialog()
    .contains('span', 'successfully')
    .should('have.length', 1);
}

// Selects an account from the menu
function selectAccount(id) {
  cy.get('ul[aria-label="Accounts"]')
    .find('p')
    .contains(id)
    .click();
}

beforeEach(() => {
  cy.visit('http://localhost:3000/')
    .then(() => cy.fixture('accounts').as('accounts'))
    .then(accounts => {
      lstore.set('accounts', accounts.storedAccounts);
      lstore.set('secrets', accounts.secrets);
      lstore.set('lastSelectedAccount', accounts.storedAccounts[0].id);
      // reload the page to get the account overview
      cy.visit('http://localhost:3000/');
    });
  // mock the server
  cy.server();
  // make the responses inspectable (not a stub)
  cy.route('POST', '**/peer/transactions').as('postTransaction');
});

afterEach(() => {
  lstore.clearAll();
});

context('Wallet', () => {
  it('send funds', () => {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    assertAutofocus();
    // type in the recipient address
    fillDialogInput(0, lstore.get('accounts')[1].id);
    // type in the amount
    fillDialogInput(1, '0.001');
    // click submit
    clickDialogSubmit();
    fillConfirmationDialog();
    assertSuccessfulDialog();
    // assert the request
    cy.wait('@postTransaction')
      .its('status')
      .should('eq', 200);
  });

  it('switch between accounts', () => {
    // click the menu
    selectAccount(getAccount(1).id);
    // assert the header
    cy.get('main > :nth-child(2)')
      .find('p')
      .contains(getAccount(1).id)
      .should('have.length', 1);
    // TODO assert the URL
  });
});

context('Settings', () => {
  beforeEach(() => {
    goToSettings();
  });

  it('register delegate', () => {
    // stab the route
    cy.route({
      method: 'POST',
      url: '**/peer/transactions',
      response: {
        success: true,
        transactionId: '42323498723942398'
      }
    }).as('postTransaction');
    cy.get('main')
      .find('p')
      .should('contain', 'Not registered');
    clickSettingsRow('Delegate registration');
    // assertAutofocus(); TODO broken
    // type in the name
    const name = 'test';
    fillDialogInput(0, name);
    clickDialogSubmit();
    fillConfirmationDialog();
    assertSuccessfulDialog();
    // assert the request
    cy.get('@postTransaction').should(xhr => {
      expect(xhr.requestBody.transaction.asset.delegate).to.have.property(
        'username',
        name
      );
      expect(xhr.requestBody.transaction.asset.delegate).to.have.property(
        'publicKey',
        getAccount(0).publicKey
      );
    });
  });

  it('2nd passphrase', () => {
    // stab the route
    cy.route({
      method: 'POST',
      url: '**/peer/transactions',
      response: {
        success: true,
        transactionId: '42323498723942398'
      }
    }).as('postTransaction');
    selectAccount(getAccount(1).id);
    cy.wait(1000);
    goToSettings();
    cy.get('main')
      .find('p')
      .should('contain', 'Not set');
    clickSettingsRow('2nd passphrase');
    // assertAutofocus(); TODO broken
    // type in the passphrase
    const passphrase = 'test';
    fillDialogInput(0, passphrase);
    clickDialogSubmit();
    fillConfirmationDialog(getSecrets(1).mnemonic, passphrase);
    assertSuccessfulDialog();
    // assert the request
    cy.get('@postTransaction').should(xhr => {
      expect(xhr.requestBody.transaction.asset.signature).to.have.property(
        'publicKey',
        '67d3b5eaf0c0bf6b5a602d359daecc86a7a74053490ec37ae08e71360587c870'
      );
    });
  });

  it('vote delegate', () => {
    clickSettingsRow('Voted delegate');
    // assertAutofocus(); TODO broken
    // type in the query
    fillDialogInput(0, 'test');
    // wait for results
    getDialogContent()
      .find('button:visible')
      .its('length')
      .should('be.gt', 0);
    // pick the first result (2nd button)
    clickDialogButton(1);
    fillConfirmationDialog()
    assertSuccessfulDialog();
    // assert the request
    cy.wait('@postTransaction')
      .its('status')
      .should('eq', 200);
  });

  it('account name', () => {
    clickSettingsRow('Account name');
    assertAutofocus();
    // type in the query
    const newName = 'new name ' + Math.random();
    fillDialogInput(0, newName);
    clickDialogButton(1).then(_ => {
      expect(getAccount(0).name).to.eql(newName);
      // wait for observables to settle
      cy.wait(1000);
    });
  });

  it('pinned', () => {
    cy.wait(1000);
    clickSettingsRow('Pinned').then(_ => {
      expect(getAccount(0).pinned).to.eql(true);
      // wait for observables to settle
      cy.wait(1000);
    });
  });

  it('FIAT', () => {
    clickSettingsRow('FIAT');
    getDialog()
      .find('select')
      .select('EUR');
    clickDialogButton(2)
      .then(_ => {
        expect(getAccount(0).fiatCurrency).to.eql('EUR');
      });
  });
});

context('Form validation', () => {
  it('confirmation passphrase', () => {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, getAccount(1).id);
    // type in the amount
    fillDialogInput(1, '1');
    // click submit
    clickDialogSubmit();
    // type in the mnemonic
    fillDialogInput(0, getSecrets(0).mnemonic);
    // type in the passphrase
    fillDialogInput(1, 'wrong');
    // click submit
    clickDialogSubmit();
    getDialog()
      .contains('p', 'Incorrect passphrase')
      .should('have.length', 1);
    closeDialog();
  });

  it('confirmation mnemonic', () => {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, getAccount(1).id);
    // type in the amount
    fillDialogInput(1, '1');
    // click submit
    clickDialogSubmit();
    // type in the mnemonic
    fillDialogInput(0, 'wrong');
    // type in the passphrase
    fillDialogInput(1, getSecrets(0).passphrase);
    // click submit
    clickDialogSubmit();
    getDialog()
      .contains('p', 'Incorrect secret')
      .should('have.length', 1);
    closeDialog();
  });
});

context('Dialog navigation', () => {
  it('go back to the first form', () => {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, getAccount(1).id);
    // type in the amount
    fillDialogInput(1, '0.001');
    // click submit
    clickDialogSubmit();
    // click the back button
    clickDialogButton(0);
    getDialog()
      .contains('h1', 'Send RISE')
      .should('have.length', 1);
    closeDialog();
  });

  it('close button on the first form', () => {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // click the close button
    clickDialogButton(0);
    // assert that the dialog is gone
    cy.get('body')
      .find('div[role="dialog"]')
      .should('not.exist');
  });

  it('close button on the second form', () => {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, getAccount(1).id);
    // type in the amount
    fillDialogInput(1, '0.001');
    // click submit
    clickDialogSubmit();
    // click the close button
    clickDialogButton(1);
    // assert that the dialog is gone
    cy.get('body')
      .find('div[role="dialog"]')
      .should('not.exist');
  });

  it('no navigation buttons during a submission', () => {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, getAccount(1).id);
    // type in the amount
    fillDialogInput(1, '0.001');
    // click submit
    clickDialogSubmit();
    fillConfirmationDialog();
    // assert theres no buttons
    getDialogHeader()
      .find('button')
      .should('not.exist');
    assertSuccessfulDialog();
    // click the close button
    clickDialogButton(0);
  });
});
