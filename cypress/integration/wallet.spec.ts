/// <reference types="Cypress" />
import * as lstore from 'store';
import {
  selectAccount,
  assertSuccessfulDialog,
  getSecrets,
  getAccount,
  closeDialog,
  assertAutofocus,
  clickSettingsRow,
  goToSettings,
  fillConfirmationDialog,
  clickDialogButton,
  clickDialogSubmit,
  fillDialogInput,
  getDialogHeader,
  getDialogContent,
  getDialog,
  openRegisterDelegateDialog,
  getDialogInput
} from '../plugins/helpers';

const url = 'http://localhost:3000';
beforeEach(function() {
  cy.location()
    .then(location => {
      if (!location.toString().includes(url)) {
        return cy.visit(url);
      }
    })
    .then(() => cy.fixture('accounts').as('accounts'))
    .then(accounts => {
      this.accounts = accounts;
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
    cy.location('pathname').then(location => {
      expect(location).to.contain(`/account/${getAccount().id}`);
    });
  });

  it('navigate back from settings', () => {
    goToSettings();
    cy.get('header')
      .find('button')
      .click();
    // click the menu
    selectAccount(getAccount().id);
    // assert the header
    cy.get('main > :nth-child(2)')
      .find('p')
      .contains(getAccount().id)
      .should('have.length', 1);
  });

  it('sign out', () => {
    cy.get('ul[aria-label="Navigation"]')
      .find('span')
      .contains('Sign out')
      .click()
      .then(_ => {
        expect(lstore.get('accounts')).to.eql(undefined);
        expect(lstore.get('lastSelectedAccount')).to.eql(undefined);
      });
  });

  it('create a 2nd account', () => {
    cy.get('ul[aria-label="Accounts"]')
      .find('span')
      .contains('Add an account')
      .click();
    // assert the url
    cy.url().should('contain', '/onboarding/add-account');
    // assert the new account type
    cy.get('body')
      .find('span')
      .contains('Existing account')
      .should('have.length', 1);
  });

  it('transaction details', () => {
    // re-querying for the details panel shouldn't be necessary
    // but the .end() method doesn't seems to work (selection == null)
    function getDetails() {
      return (
        cy
          .get('main aside + div > div:nth-child(2)')
          .find('div[aria-expanded="true"][role="button"]')
          .eq(0)
          // move to the expanded panel
          .next()
      );
    }

    // click the second transaction row (the first one isn't confirmed yet)
    cy.get('main aside + div > div:nth-child(2)')
      .find('div[aria-expanded="false"][role="button"]')
      .eq(0)
      .click()
      // check if opened
      .should('have.attr', 'aria-expanded', 'true')
      // move to the expanded panel
      .next()
      // check if visible
      .should('be.visible');

    // check for "confirmed"
    getDetails()
      .find('span')
      .contains('Confirmed')
      .should('have.length', 1)
      .end()
      .end();

    // check for "Timestamp"
    getDetails()
      .find('span')
      .contains('Timestamp')
      .should('have.length', 1);

    // check for the "Return funds" button
    getDetails()
      .contains('Send again')
      .should('have.length', 1);
  });
});

context('Settings', () => {
  beforeEach(() => {
    goToSettings();
  });

  it('register delegate (stabbed)', () => {
    // stab the route
    cy.route({
      method: 'POST',
      url: '**/peer/transactions',
      response: {
        success: true,
        transactionId: '42323498723942398'
      }
    }).as('postTransaction');
    openRegisterDelegateDialog();
    // type in the name
    const name = 'test';
    fillDialogInput(0, name);
    clickDialogSubmit();
    fillConfirmationDialog();
    assertSuccessfulDialog();
    // assert the request
    // @ts-ignore TODO wrong defs
    cy.get('@postTransaction').should((xhr: Cypress.WaitXHR) => {
      // @ts-ignore TODO wrong defs
      expect(xhr.requestBody.transaction.asset.delegate).to.have.property(
        'username',
        name
      );
      // @ts-ignore TODO wrong defs
      expect(xhr.requestBody.transaction.asset.delegate).to.have.property(
        'publicKey',
        getAccount(0).publicKey
      );
    });
  });

  it('2nd passphrase (stabbed)', () => {
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
    // type in the passphrase
    const passphrase = 'test';
    fillDialogInput(0, passphrase);
    clickDialogSubmit();
    fillConfirmationDialog(getSecrets(1).mnemonic, passphrase);
    assertSuccessfulDialog();
    // assert the request
    // @ts-ignore TODO wrong defs
    cy.get('@postTransaction').should(xhr => {
      // @ts-ignore TODO wrong defs
      expect(xhr.requestBody.transaction.asset.signature).to.have.property(
        'publicKey',
        '67d3b5eaf0c0bf6b5a602d359daecc86a7a74053490ec37ae08e71360587c870'
      );
    });
  });

  it('vote delegate when already voted (stabbed)', () => {
    // stab the route
    cy.route({
      method: 'POST',
      url: '**/peer/transactions',
      response: {
        success: true,
        transactionId: '42323498723942398'
      }
    }).as('postTransaction');
    clickSettingsRow('Voted delegate');
    fillDialogInput(0, 'test');
    // wait for results
    getDialogContent()
      .find('button:visible')
      .its('length')
      .should('be.gt', 0);
    // pick the first result (2nd button)
    clickDialogButton(1, true);
    fillConfirmationDialog();
    assertSuccessfulDialog();
    // assert the request
    // @ts-ignore TODO wrong defs
    cy.get('@postTransaction').should(xhr => {
      // assert the prev vote reverted
      // @ts-ignore TODO wrong defs
      expect(xhr.requestBody.transaction.asset.votes[0]).to.match(
        /^-[\d\w]{10,}/
      );
      // assert the new vote sent
      // @ts-ignore TODO wrong defs
      expect(xhr.requestBody.transaction.asset.votes[1]).to.match(
        /^\+[\d\w]{10,}/
      );
    });
  });

  it('account name', () => {
    clickSettingsRow('Account name');
    // type in the query
    const newName = 'new name ' + Math.random();
    fillDialogInput(0, newName);
    clickDialogButton(1).then(_ => {
      expect(getAccount().name).to.eql(newName);
      // wait for observables to settle
      cy.wait(1000);
    });
  });

  it('pinned', () => {
    cy.wait(1000);
    clickSettingsRow('Pinned').then(_ => {
      expect(getAccount().pinned).to.eql(true);
      // wait for observables to settle
      cy.wait(1000);
    });
  });

  it('FIAT', () => {
    clickSettingsRow('FIAT');
    getDialog()
      .find('select')
      .select('EUR');
    clickDialogButton(2).then(_ => {
      expect(getAccount().fiatCurrency).to.eql('EUR');
    });
  });

  it('remove account', () => {
    clickSettingsRow('Remove account');
    fillDialogInput(0, getAccount().id);
    clickDialogSubmit().then(() => {
      expect(lstore.get('accounts')).to.have.length(1);
    });
  });
});

context('Settings dialogs autofocus', () => {
  beforeEach(() => {
    goToSettings();
  });

  it('register delegate', () => {
    openRegisterDelegateDialog();
    assertAutofocus();
  });

  it('2nd passphrase', () => {
    // use the second account
    selectAccount(getAccount(1).id);
    cy.wait(1000);
    // go to the settings of the second account
    goToSettings();
    clickSettingsRow('2nd passphrase');
    assertAutofocus();
  });

  it('vote delegate', () => {
    clickSettingsRow('Voted delegate');
    assertAutofocus();
  });
  it('account name', () => {
    clickSettingsRow('Account name');
    assertAutofocus();
  });

  it('FIAT', () => {
    clickSettingsRow('FIAT');
    assertAutofocus('select');
  });

  it('remove account', () => {
    clickSettingsRow('Remove account');
    assertAutofocus();
  });
});

context('Form validation', function() {
  it('confirmation passphrase', function() {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, this.accounts.storedAccounts[1].id);
    // type in the amount
    fillDialogInput(1, '1');
    // click submit
    clickDialogSubmit();
    // type in the mnemonic
    fillDialogInput(0, getSecrets().mnemonic);
    // type in the passphrase
    fillDialogInput(1, 'wrong');
    // click submit
    clickDialogSubmit();
    getDialog()
      .contains('p', 'Incorrect passphrase')
      .should('have.length', 1);
    closeDialog();
  });

  it('confirmation mnemonic', function() {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, this.accounts.storedAccounts[1].id);
    // type in the amount
    fillDialogInput(1, '1');
    // click submit
    clickDialogSubmit();
    // type in the mnemonic
    fillDialogInput(0, 'wrong');
    // type in the passphrase
    fillDialogInput(1, getSecrets().passphrase);
    // click submit
    clickDialogSubmit();
    getDialog()
      .contains('p', 'Incorrect secret')
      .should('have.length', 1);
    closeDialog();
  });

  it('passphrase when setting it', () => {
    selectAccount(getSecrets(1).id);
    goToSettings();
    clickSettingsRow('2nd passphrase');
    // type in the new passphrase
    fillDialogInput(0, 'test');
    clickDialogSubmit();
    // type in the mnemonic
    fillDialogInput(0, getSecrets(1).mnemonic);
    // type in a wrong passphrase
    fillDialogInput(1, 'wrong');
    // click submit
    clickDialogSubmit();
    getDialog()
      .contains('p', 'Incorrect passphrase')
      .should('have.length', 1);
    closeDialog();
  });

  it('send dialog', () => {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, 'wrong address');
    // type in the amount
    fillDialogInput(1, '0wer0.056');
    // click submit
    clickDialogSubmit();
    getDialog()
      .contains('p', 'Invalid RISE address')
      .should('have.length', 1);
    getDialog()
      .contains('p', 'Invalid amount')
      .should('have.length', 1);
    closeDialog();
  });

  it('vote delegate, uppercase query', () => {
    goToSettings();
    clickSettingsRow('Voted delegate');
    // type an uppercase query
    fillDialogInput(0, 'TEST');
    getDialog()
      .contains('p', 'Delegate username query must be all lowercase')
      .should('have.length', 1);
    closeDialog();
  });
});

context('Dialog navigation', function() {
  it('go back to the first form', function() {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, this.accounts.storedAccounts[1].id);
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

  it('close button on the second form', function() {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, this.accounts.storedAccounts[1].id);
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

  it('no navigation buttons during a submission', function() {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, this.accounts.storedAccounts[1].id);
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

  context('preserves inputted data', () => {
    beforeEach(() => {
      goToSettings();
    });

    it('register delegate', () => {
      const name = 'test';
      openRegisterDelegateDialog();
      fillDialogInput(0, name);
      clickDialogSubmit();
      clickDialogButton(0).then(_ => {
        getDialogInput(0).should('have.value', name);
      });
    });

    it('vote delegate', () => {
      const query = 'test';
      clickSettingsRow('Voted delegate');
      fillDialogInput(0, query);
      // wait for results
      getDialogContent()
        .find('button:visible')
        .its('length')
        .should('be.gt', 0);
      // pick the first result (2nd button)
      clickDialogButton(1, true);
      // go back
      clickDialogButton(0);
      clickDialogButton(0).then(_ => {
        getDialogInput(0).should('have.value', query);
      });
    });
  });
});

context('URLs', () => {
  context('settings', () => {
    beforeEach(() => {
      goToSettings();
    });

    it('main settings page', () => {
      cy.url().should('contain', `/settings/${getAccount().id}`);
    });

    it('register delegate', () => {
      openRegisterDelegateDialog();
      cy.url().should('contain', `/settings/delegate/${getAccount().id}`);
    });

    it('2nd passphrase', () => {
      clickSettingsRow('2nd passphrase');
      cy.url().should('contain', `/settings/passphrase/${getAccount().id}`);
    });

    it('vote delegate', () => {
      clickSettingsRow('Voted delegate');
      cy.url().should('contain', `/settings/vote/${getAccount().id}`);
    });
    it('account name', () => {
      clickSettingsRow('Account name');
      cy.url().should('contain', `/settings/name/${getAccount().id}`);
    });

    it('FIAT', () => {
      clickSettingsRow('FIAT');
      cy.url().should('contain', `/settings/fiat/${getAccount().id}`);
    });

    it('remove account', () => {
      clickSettingsRow('Remove account');
      cy.url().should('contain', `/settings/remove/${getAccount().id}`);
    });
  });

  context('auto fill the last account ID', () => {
    it('main settings page', () => {
      cy.visit(`${url}/settings`);
      cy.url().should('contain', `/settings/${getAccount().id}`);
    });

    it('register delegate', () => {
      cy.visit(`${url}/settings/delegate`);
      cy.url().should('contain', `/settings/delegate/${getAccount().id}`);
    });

    it('2nd passphrase', () => {
      cy.visit(`${url}/settings/passphrase`);
      cy.url().should('contain', `/settings/passphrase/${getAccount().id}`);
    });

    it('vote delegate', () => {
      cy.visit(`${url}/settings/vote`);
      cy.url().should('contain', `/settings/vote/${getAccount().id}`);
    });
    it('account name', () => {
      cy.visit(`${url}/settings/name`);
      cy.url().should('contain', `/settings/name/${getAccount().id}`);
    });

    it('FIAT', () => {
      cy.visit(`${url}/settings/fiat`);
      cy.url().should('contain', `/settings/fiat/${getAccount().id}`);
    });

    it('remove account', () => {
      cy.visit(`${url}/settings/remove`);
      cy.url().should('contain', `/settings/remove/${getAccount().id}`);
    });
  });
});
