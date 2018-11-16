/// <reference types="Cypress" />
import * as lstore from 'store';

const url = 'https://localhost:3000';
beforeEach(function() {
  cy.location()
    .then(location => {
      if (!location.toString().includes(url)) {
        return cy.visit(url);
      }
    })
    .then(() => cy.fixture('ledger').as('ledger'))
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
});
