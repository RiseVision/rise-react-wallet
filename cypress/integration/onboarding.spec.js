/// <reference types="Cypress" />
import lstore from 'store';
import { getAccount } from '../plugins/helpers';

beforeEach(function() {
  cy.visit('http://localhost:3000/');
  cy.fixture('accounts')
    .as('accounts')
    .then(accounts => {
      this.accounts = accounts;
    });
});

afterEach(() => {
  lstore.clearAll();
});

context('Onboarding', function() {
  it('add an existing account', function() {
    // save the fixtures
    const storedAccounts = this.accounts.storedAccounts;
    // check the url
    cy.url().should('contain', '/onboarding/add-account');
    // click "Existing account"
    cy.get('body')
      .find('div')
      .contains('Existing account')
      .click();
    // enter the ID
    cy.get('input').type(storedAccounts[0].id);
    // submit
    cy.get('button[type="submit"]').click();
    // choose Full access and wait for the wallet page
    cy.get('body')
      .find('div')
      .contains('Full access account')
      .click();
    // wait for the recent transaction list
    cy.wait(2000).then(() => {
      const newAccount = getAccount(0);
      expect(newAccount.id).to.deep.eq(storedAccounts[0].id);
      cy.url().should('contain', `/account/${newAccount.id}`);
    });
  });
});
