/// <reference types="Cypress" />
import * as lstore from 'store';
import {
  assertAutofocus,
  clickDialogSubmit,
  fillDialogInput
} from '../plugins/helpers';

const url = 'https://localhost:3000/address-book';
beforeEach(function() {
  let accounts: any;
  cy.location()
    .then(location => {
      if (!location.toString().includes(url)) {
        return cy.visit(url);
      }
    })
    .then(() => cy.fixture('accounts').as('accounts'))
    .then((_: any) => {
      accounts = _;
      return cy.fixture('contacts').as('contacts');
    })
    .then(contacts => {
      this.accounts = accounts;
      this.contacts = contacts;
      lstore.set('accounts', accounts.storedAccounts);
      lstore.set('secrets', accounts.secrets);
      lstore.set('contacts', contacts);
      lstore.set('lastSelectedAccount', accounts.storedAccounts[0].id);
      // reload the page to get the account overview
      cy.visit(url);
    });
  // mock the server
  cy.server();
  // make the responses inspectable (not a stub)
  cy.route('PUT', '**/api/transactions').as('putTransaction');
});

afterEach(() => {
  lstore.clearAll();
});

context('Address Book', () => {
  it('add a contact', () => {
    const id = '10317456780953445769R';
    const name = 'test test';
    // click the New Contact button
    cy.get('a[title="New contact"]').click();
    assertAutofocus();
    // type in the recipient name
    fillDialogInput(0, name);
    // type in the address
    fillDialogInput(1, id);
    // click submit
    clickDialogSubmit();
    // assert the new contact
    cy.get('main')
      .find('td')
      .contains(name)
      .should('have.length', 1);
    // assert the new contact
    cy.get('main')
      .find('td')
      .contains(id)
      .should('have.length', 1)
      .then(() => {
        // assert localStorage
        expect(lstore.get('contacts')[2].name).to.eql(name);
      });
  });

  it('contacts list', function() {
    // assert the number of table rows
    cy.get('main')
      .find('table tbody tr')
      .should('have.length', this.contacts.length);
    // assert all of IDs and names
    for (const { id, name } of this.contacts) {
      cy.get('main')
        .find('td')
        .contains(id)
        .should('have.length', 1);
      cy.get('main')
        .find('td')
        .contains(name)
        .should('have.length', 1);
    }
  });

  it('edit a contact', function() {
    const id = '10317456780953445769R';
    const name = 'test test';
    // open the edit dialog for the first contact
    cy.get('main')
      .find('td')
      .contains(this.contacts[0].name)
      .should('have.length', 1)
      .parents('tr')
      .find('a[title="Modify contact"]')
      .should('have.length', 1)
      .click();
    // change the name
    fillDialogInput(0, `{selectall}${name}`);
    // submit
    clickDialogSubmit();
    // assert the that list has changes
    cy.get('main')
      .find('td')
      .contains(name)
      .should('have.length', 1)
      .then(() => {
        // assert localStorage
        expect(lstore.get('contacts')[0].name).to.eql(name);
      });
  });

  it('remove a contact', function() {
    const name = this.contacts[0].name;
    // open the edit dialog for the first contact
    cy.get('main')
      .find('td')
      .contains(name)
      .should('have.length', 1)
      .parents('tr')
      .find('a[title="Delete contact"]')
      .should('have.length', 1)
      .click();
    // confirm
    clickDialogSubmit();
    // assert the that list has changes
    cy.get('main')
      .find('td')
      .contains(name)
      .should('have.length', 0)
      .then(() => {
        // assert localStorage
        expect(lstore.get('contacts')[0].name).to.not.eql(name);
      });
  });
});
