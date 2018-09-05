/// <reference types="Cypress" />
import lstore from 'store';

// TODO move to fixtures
const fixtures = {
  id: '12525095472804841547R',
  mnemonic:
    'cable swamp sauce release kitchen build torch midnight foot silk subway deliver',
  passphrase: 'foo',
  account: {
    id: '12525095472804841547R',
    publicKey:
      '14d8cb7099e9a2119d6a6f1011d4d2a56cc9ffea35bbafe4a62790b1fb7e5926',
    readOnly: false,
    fiatCurrency: 'USD',
    name: null,
    pinned: false
  }
};

const fixtures2 = {
  id: '10317456780953445784R'
};

// TODO move to helpers

function getDialog(child = '') {
  return cy.get(`div[role="dialog"] ${child}`);
}

function getDialogContent() {
  // TODO should query a form element
  return getDialog('> div:nth-child(2) > div:nth-child(2)');
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
  // type in the mnemonic
  fillDialogInput(0, mnemonic);
  // type in the passphrase and the Enter key
  fillDialogInput(1, passphrase + '{enter}');
  return getDialog()
    .contains('span', 'successfully')
    .should('have.length', 1);
}

function goToSettings() {
  // click the Settings button
  cy.get('button[title="Account settings"]').click();
  // assert the URL
  return cy.url().should('contain', 'settings/12525095472804841547R');
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

beforeEach(() => {
  cy.visit('http://localhost:3000/').then(() => {
    lstore.set('accounts', [fixtures.account]);
    lstore.set('lastSelectedAccount', fixtures.account.id);
    cy.visit('http://localhost:3000/');
  });
});

afterEach(() => {
  lstore.clearAll();
});

context('Wallet', () => {
  it('send funds', () => {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // assert the URL
    cy.url().should('contain', 'send/12525095472804841547R');
    assertAutofocus();
    // type in the recipient address
    fillDialogInput(0, fixtures2.id);
    // type in the amount
    fillDialogInput(1, '0.1');
    // click submit
    clickDialogSubmit();
    // type in the mnemonic
    fillDialogInput(0, fixtures.mnemonic);
    // type in the passphrase and the Enter key
    fillDialogInput(1, fixtures.passphrase + '{enter}');
    getDialog()
      .contains('span', 'successfully')
      .should('have.length', 1);
    // TODO assert the backend
    // getDialog().find('button').eq(0).click()
  });
});

context('Settings', () => {
  it('vote delegate', () => {
    goToSettings();
    clickSettingsRow('Voted delegate');
    assertAutofocus();
    // type in the query
    fillDialogInput(0, 'test');
    // wait for results
    getDialogContent()
      .find('button:visible')
      .its('length')
      .should('be.gt', 0);
    // pick the first result (2nd button)
    clickDialogButton(1);
    fillConfirmationDialog(fixtures.mnemonic, fixtures.passphrase);
    // TODO assert the backend
    // getDialog().find('button').eq(0).click()
  });

  it('account name', () => {
    goToSettings();
    clickSettingsRow('Account name');
    assertAutofocus();
    // type in the query
    const newName = 'new name ' + Math.random();
    fillDialogInput(0, newName);
    clickDialogButton(1)
      .then(_ => cy.wait(1000))
      .then(_ => {
        expect(lstore.get('accounts')[0].name).to.eql(newName);
      });
  });

  it('pinned', () => {
    goToSettings();
    clickSettingsRow('Pinned')
      .then(_ => cy.wait(1000))
      .then(_ => {
        console.log(lstore.get('accounts')[0])
        expect(lstore.get('accounts')[0].pinned).to.eql(true);
      });
  });

  it('FIAT', () => {
    goToSettings();
    clickSettingsRow('FIAT');
    getDialog()
      .find('select')
      .select('EUR');
    clickDialogButton(2)
      .then(_ => cy.wait(1000))
      .then(_ => {
        expect(lstore.get('accounts')[0].fiatCurrency).to.eql('EUR');
      });
  });
});

context('Wallet errors', () => {
  it('confirmation passphrase', () => {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, fixtures2.id);
    // type in the amount
    fillDialogInput(1, '1');
    // click submit
    clickDialogSubmit();
    // type in the mnemonic
    fillDialogInput(0, fixtures.mnemonic);
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
    fillDialogInput(0, fixtures2.id);
    // type in the amount
    fillDialogInput(1, '1');
    // click submit
    clickDialogSubmit();
    // type in the mnemonic
    fillDialogInput(0, 'wrong');
    // type in the passphrase
    fillDialogInput(1, fixtures.passphrase);
    // click submit
    clickDialogSubmit();
    getDialog()
      .contains('p', 'Incorrect secret')
      .should('have.length', 1);
    closeDialog();
  });
});
