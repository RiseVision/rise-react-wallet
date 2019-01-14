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
  clickDialogBackButton,
  clickDialogSubmit,
  fillDialogInput,
  getDialogHeader,
  getDialogContent,
  getDialog,
  openRegisterDelegateDialog,
  getDialogInput,
  assertUnsuccessfulDialog,
  getTransactionDetails,
  expandTransactionDetails,
  getDialogButtons
} from '../plugins/helpers';

const url = 'https://localhost:3000';
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
      cy.visit('https://localhost:3000/');
    });
  // mock the server
  cy.server();
  // make the responses inspectable (not a stub)
  cy.route('PUT', '**/api/transactions').as('putTransaction');
});

afterEach(() => {
  lstore.clearAll();
});

context('Wallet', () => {
  it('send coins', () => {
    const id = lstore.get('accounts')[1].id;
    // click the Send RISE button
    cy.get('a[title="Send RISE"]').click();
    assertAutofocus();
    // type in the recipient address (esc closes auto-completion)
    fillDialogInput(0, `${id}{esc}`);
    // type in the amount
    fillDialogInput(1, '0.001');
    // click submit
    clickDialogSubmit();
    fillConfirmationDialog();
    assertSuccessfulDialog();
    // assert the request
    // TODO breaks on the prod build
    // cy.wait('@putTransaction')
    //   .its('status')
    //   .should('eq', 200);
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
      .find('a[aria-label="Navigate back"]')
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
      .click();

    getDialogContent()
      .contains('button', 'Sign out')
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
    // click the second transaction row
    expandTransactionDetails(1)
      // check if opened
      .should('have.attr', 'aria-expanded', 'true')
      // move to the expanded panel
      .next()
      // check if visible
      .should('be.visible');

    // check for "confirmed"
    // re-querying for the details panel shouldn't be necessary
    // but the .end() method doesn't seems to work (selection == null)
    getTransactionDetails(1)
      .find('span')
      .contains('Send')
      .should('have.length', 1)
      .end()
      .end();

    // check for "Timestamp"
    getTransactionDetails(1)
      .find('span')
      .contains('Timestamp')
      .should('have.length', 1);

    // check for the "Return funds" button
    getTransactionDetails(1)
      .contains('Send again')
      .should('have.length', 1);
  });

  it('transaction - Send Again button', () => {
    // click the second transaction row
    expandTransactionDetails(1);
    getTransactionDetails(1)
      .contains('Send again')
      .click();
    // TODO assert with read address and amount
    cy.url().should('contain', `/send/${getAccount().id}`);
    getDialogInput(0).then(input => {
      // TODO assert with a real address
      expect(input.val()).have.length.above(1);
    });
    getDialogInput(1).then(input => {
      // TODO assert with a real amount
      expect(input.val()).have.length.above(0);
    });
  });

  it('transaction - edit account name', () => {
    const name = 'test-name';
    // click the second transaction row
    expandTransactionDetails(1);
    getTransactionDetails(1)
      .find('button[aria-label="Add sender to contacts"]')
      .click();
    fillDialogInput(0, name);
    clickDialogSubmit();
    getTransactionDetails()
      .find('span')
      .contains(name)
      .should('have.length', 1);
    // TODO test the ModifyContact dialog, requires additional fixtures
    // and a transaction to that account
  });

  it('navigate to the address book', () => {
    cy.get('ul[aria-label="Navigation"]')
      .find('span')
      .contains('Address book')
      .click();
    // assert the url
    cy.url().should('contain', '/address-book');
    // assert the header
    cy.get('h6')
      .contains('Address book')
      .should('have.length', 1);
  });
});

context('Server errors', () => {
  it('error messages', () => {
    const id = lstore.get('accounts')[1].id;
    // stab the route
    cy.route({
      method: 'PUT',
      url: '**/api/transactions',
      response: {
        success: true,
        invalid: [{ id: '42323498723942398', reason: 'test reason' }]
      }
    }).as('putTransaction');
    // click the Send RISE button
    cy.get('a[title="Send RISE"]').click();
    // type in the recipient address (esc closes auto-completion)
    fillDialogInput(0, `${id}{esc}`);
    // type in the amount
    fillDialogInput(1, '0.001');
    // click submit
    clickDialogSubmit();
    fillConfirmationDialog();
    assertUnsuccessfulDialog('test reason');
  });

  it('retry', () => {
    const id = lstore.get('accounts')[1].id;
    // stab the route
    cy.route({
      method: 'PUT',
      url: '**/api/transactions',
      response: {
        success: true,
        invalid: [{ id: '42323498723942398', reason: 'test reason' }]
      }
    }).as('putTransaction');
    // click the Send RISE button
    cy.get('a[title="Send RISE"]').click();
    // type in the recipient address (esc closes auto-completion)
    fillDialogInput(0, `${id}{esc}`);
    // type in the amount
    fillDialogInput(1, '0.001');
    // click submit
    clickDialogSubmit();
    fillConfirmationDialog();
    // assert the retry button
    getDialogContent('button')
      .find('span')
      .contains('Try again')
      .should('have.length', 1)
      .then(_ => {
        // click 'Try again'
        clickDialogButton(0);
        // make a new stab to assert the retry hit
        // TODO doesnt work
        cy.route({
          method: 'PUT',
          url: '/api/transactions',
          response: {
            success: true,
            invalid: [{ id: '11111111111', reason: 'retry reason' }]
          }
        }).as('putTransaction');
        // TODO should asserts 'retry reason'
        assertUnsuccessfulDialog('test reason');
      });
  });
});

context('Settings', () => {
  beforeEach(() => {
    goToSettings();
  });

  it('register delegate (stabbed)', () => {
    // stab the route
    cy.route({
      method: 'PUT',
      url: '**/api/transactions',
      response: {
        success: true,
        accepted: ['42323498723942398'],
        invalid: []
      }
    }).as('putTransaction');
    openRegisterDelegateDialog();
    // type in the name
    const name = 'test';
    fillDialogInput(0, name);
    clickDialogSubmit();
    fillConfirmationDialog();
    assertSuccessfulDialog();
    // assert the request
    // @ts-ignore TODO wrong defs
    cy.get('@putTransaction').should((xhr: Cypress.WaitXHR) => {
      // @ts-ignore TODO wrong defs
      expect(xhr.requestBody.transaction.asset.delegate).to.have.property(
        'username',
        name
      );
    });
  });

  it('2nd passphrase (stabbed)', () => {
    // stab the route
    cy.route({
      method: 'PUT',
      url: '**/api/transactions',
      response: {
        success: true,
        accepted: ['42323498723942398']
      }
    }).as('putTransaction');
    selectAccount(getSecrets(1).id);
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
    cy.get('@putTransaction').should(xhr => {
      // @ts-ignore TODO wrong defs
      expect(xhr.requestBody.transaction.asset.signature).to.have.property(
        'publicKey',
        '67d3b5eaf0c0bf6b5a602d359daecc86a7a74053490ec37ae08e71360587c870'
      );
    });
  });

  it('vote delegate when already voted (stabbed)', () => {
    const query = 'test';
    // stab the route
    cy.route({
      method: 'PUT',
      url: '**/api/transactions',
      response: {
        success: true,
        accepted: ['42323498723942398']
      }
    }).as('putTransaction');
    clickSettingsRow('Voted delegate');
    fillDialogInput(0, query);
    // wait for results
    getDialogContent()
      .find('button:visible', { timeout: 5000 })
      .its('length')
      .should('be.gt', 0);
    cy.wait(1000);
    // check if all the results contain the search query
    getDialogButtons()
      .prev()
      .each(el => {
        const name = el
          .find('p')
          .eq(0)
          .text();
        expect(name).to.contain(query);
      });
    // pick the first result
    clickDialogButton(0, true);
    fillConfirmationDialog();
    assertSuccessfulDialog();
    // assert the request
    // @ts-ignore TODO wrong defs
    cy.get('@putTransaction').should(xhr => {
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

  it('vote delegate, uppercase query', () => {
    clickSettingsRow('Voted delegate');
    // type an uppercase query
    fillDialogInput(0, 'TEsT');
    getDialog()
      .contains('p', 'Search results for "test"')
      .should('have.length', 1);
  });

  it('vote delegate, search by ID', () => {
    // TODO use satisfy
    // .should('satisfy', el => !el.parent().text().includes('Loading'))
    clickSettingsRow('Voted delegate');
    getDialog()
      .contains('span', 'Cast vote')
      .should('be.visible');
    // check if all the results contain the search query
    getDialogButtons()
      .prev()
      .eq(0)
      // get the ID of the first delegate
      // TODO check for "No result to display" <= 2
      .then(el => {
        return el
          .find('p')
          .eq(1)
          .text();
      })
      .then(id => {
        // fill the search with the ID
        fillDialogInput(0, id);
        cy.wait(1000);
        // assert there's only 1 Cast Vote button
        getDialogContent()
          .find('span')
          .contains('Cast vote')
          .should('have.length', 1)
          .should('be.visible');
      });
  });

  it('account name', () => {
    clickSettingsRow('Account name');
    // type in the query
    const newName = 'new name ' + Math.random();
    fillDialogInput(0, newName);
    clickDialogButton(0).then(_ => {
      expect(getAccount().name).to.eql(newName);
      // wait for observables to settle
      cy.wait(1000);
    });
  });

  // TODO test on many accounts
  it.skip('pinned', () => {
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
    clickDialogButton(0).then(_ => {
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

  // TODO sometimes selects the first account, which has the passphrase set,
  //   thus the test times out on 'Not set'
  it.skip('2nd passphrase', () => {
    // use the second account
    selectAccount(getAccount(1).id);
    cy.wait(1000);
    // go to the settings of the second account
    goToSettings();
    // wait for the info to be loaded
    cy.get('main')
      .find('p')
      .should('contain', 'Not set');
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
    const id = this.accounts.storedAccounts[1].id;
    // click the Send RISE button
    cy.get('a[title="Send RISE"]').click();
    // type in the recipient address (esc closes auto-completion)
    fillDialogInput(0, `${id}{esc}`);
    // type in the amount
    fillDialogInput(1, '1');
    // click submit
    clickDialogSubmit();
    // type in the mnemonic
    fillDialogInput(0, getSecrets().mnemonic);
    // type in the passphrase
    fillDialogInput(0, 'wrong');
    // click submit
    clickDialogSubmit();
    getDialog()
      .contains('p', 'Incorrect passphrase')
      .should('have.length', 1);
    closeDialog();
  });

  it('confirmation mnemonic', function() {
    const id = this.accounts.storedAccounts[1].id;
    // click the Send RISE button
    cy.get('a[title="Send RISE"]').click();
    // type in the recipient address (esc closes auto-completion)
    fillDialogInput(0, `${id}{esc}`);
    // type in the amount
    fillDialogInput(1, '1');
    // click submit
    clickDialogSubmit();
    // type in the mnemonic
    fillDialogInput(0, 'wrong');
    // type in the passphrase
    fillDialogInput(0, getSecrets().passphrase);
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
    fillDialogInput(0, 'wrong');
    // click submit
    clickDialogSubmit();
    getDialog()
      .contains('p', 'Incorrect passphrase')
      .should('have.length', 1);
    closeDialog();
  });

  it('send dialog', () => {
    // click the Send RISE button
    cy.get('a[title="Send RISE"]').click();
    // type in the recipient address
    fillDialogInput(0, 'wrong address{esc}');
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
});

context('Dialog navigation', function() {
  it('go back to the first form', function() {
    const id = lstore.get('accounts')[1].id;
    // click the Send RISE button
    cy.get('a[title="Send RISE"]').click();
    // type in the recipient address (esc closes auto-completion)
    fillDialogInput(0, `${id}{esc}`);
    // type in the amount
    fillDialogInput(1, '0.001');
    // click submit
    clickDialogSubmit();
    clickDialogBackButton();
    getDialog()
      .contains('h5', 'Send RISE')
      .should('have.length', 1);
    closeDialog();
  });

  it('close button on the first form', () => {
    // click the Send RISE button
    cy.get('a[title="Send RISE"]').click();
    // click the close button
    closeDialog();
    // assert that the dialog is gone
    cy.get('body')
      .find('div[role="dialog"]')
      .should('not.exist');
  });

  it('close button on the second form', function() {
    const id = lstore.get('accounts')[1].id;
    // click the Send RISE button
    cy.get('a[title="Send RISE"]').click();
    // type in the recipient address (esc closes auto-completion)
    fillDialogInput(0, `${id}{esc}`);
    // type in the amount
    fillDialogInput(1, '0.001');
    // click submit
    clickDialogSubmit();
    // click the close button
    closeDialog();
    // assert that the dialog is gone
    cy.get('body')
      .find('div[role="dialog"]')
      .should('not.exist');
  });

  it('no navigation buttons during a submission', function() {
    const id = lstore.get('accounts')[1].id;
    // click the Send RISE button
    cy.get('a[title="Send RISE"]').click();
    // type in the recipient address (esc closes auto-completion)
    fillDialogInput(0, `${id}{esc}`);
    // type in the amount
    fillDialogInput(1, '0.001');
    // click submit
    clickDialogSubmit();
    fillConfirmationDialog();
    // assert theres no buttons
    // TODO assert anchors
    getDialogHeader()
      .find('button')
      .should('not.exist');
    assertSuccessfulDialog();
    // click the close button
    closeDialog();
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
      clickDialogBackButton().then(_ => {
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
      // pick the first result
      clickDialogButton(0, true);
      // go back
      clickDialogBackButton().then(_ => {
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
