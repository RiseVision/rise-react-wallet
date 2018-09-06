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
  },
  account2: {
    id: '10317456780953445784R',
    publicKey:
      'e9ae239743b47125305a3f339937661368a7f8d810ae53d79e5c4de001356563',
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

function getStorageAccount(id) {
  return lstore.get('accounts').find(a => a.id === id);
}

function assertSuccessfulDialog() {
  getDialog()
    .contains('span', 'successfully')
    .should('have.length', 1);
}

beforeEach(() => {
  cy.visit('http://localhost:3000/').then(() => {
    lstore.set('accounts', [fixtures.account, fixtures.account2]);
    lstore.set('lastSelectedAccount', fixtures.account.id);
    cy.visit('http://localhost:3000/');
  });
  // mock the server
  cy.server();
  cy.route('POST', '**/peer/transactions').as('postTransaction');
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
    assertSuccessfulDialog();
    // assert the request
    cy.wait('@postTransaction')
      .its('status')
      .should('eq', 200);
  });

  it('switch between accounts', () => {
    // click the menu
    cy.get('ul[aria-label="Accounts"]')
      .find('p')
      .contains(fixtures2.id)
      .click();
    // assert the header
    cy.get('main > :nth-child(2)')
      .find('p')
      .contains(fixtures2.id)
      .should('have.length', 1);
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
    assertAutofocus();
    // type in the name
    fillDialogInput(0, 'test');
    clickDialogSubmit();
    fillConfirmationDialog(fixtures.mnemonic, fixtures.passphrase);
    assertSuccessfulDialog();
    // assert the request
    cy.get('@postTransaction').should(xhr => {
      expect(xhr.requestBody.transaction.asset.delegate).to.have.property(
        'username',
        'test'
      );
      expect(xhr.requestBody.transaction.asset.delegate).to.have.property(
        'publicKey',
        fixtures.account.publicKey
      );
    });
  });

  it('vote delegate', () => {
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
      const account = getStorageAccount(fixtures.account.id);
      expect(account.name).to.eql(newName);
      // wait for observables to settle
      cy.wait(1000);
    });
  });

  it('pinned', () => {
    cy.wait(1000);
    clickSettingsRow('Pinned').then(_ => {
      const account = getStorageAccount(fixtures.account.id);
      expect(account.pinned).to.eql(true);
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
      .then(_ => cy.wait(1000))
      .then(_ => {
        const account = getStorageAccount(fixtures.account.id);
        expect(account.fiatCurrency).to.eql('EUR');
      });
  });
});

context('Form validation', () => {
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

context('Dialog navigation', () => {
  it('go back to the first form', () => {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, fixtures2.id);
    // type in the amount
    fillDialogInput(1, '1');
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
    fillDialogInput(0, fixtures2.id);
    // type in the amount
    fillDialogInput(1, '1');
    // click submit
    clickDialogSubmit();
    // click the close button
    clickDialogButton(1);
    // assert that the dialog is gone
    cy.get('body')
      .find('div[role="dialog"]')
      .should('not.exist');
  });
});
