/// <reference types="Cypress" />
import * as lstore from 'store';
import {
  getAccount,
  clickDialogButton,
  fillDialogInput
} from '../plugins/helpers';

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
    // TODO: NoMnemonicNotice shows up only for the frist fullAccess account added
    // dismiss no mnemonic notice
    cy.get('body')
      .find('button')
      .contains('Go to account overview')
      .click();
    // wait for the recent transaction list
    cy.wait(2000).then(() => {
      const newAccount = getAccount(0);
      expect(newAccount.id).to.deep.eq(storedAccounts[0].id);
      cy.url().should('contain', `/account/${newAccount.id}`);
    });
  });

  it('add a new account using a secret', function() {
    // check the url
    cy.url().should('contain', '/onboarding/add-account');
    // click "New account"
    cy.get('body')
      .find('div')
      .contains('New account')
      .click();
    cy.get('body')
      .find('span')
      .contains('Create an account using a secret')
      .click();
    // click 5 dialog "tip" buttons
    for (const _ of Array(5)) {
      clickDialogButton(1);
    }
    let mnemonic: string[];
    // find the mnemonic on the page (TODO should be easier)
    cy.get('body')
      .find('span')
      .contains('This is your new 12-word mnemonic secret')
      .parentsUntil('div')
      .parent()
      .next()
      .then(div => {
        mnemonic = div
          .text()
          .trim()
          .split(' ');
      });
    let id: string;
    clickDialogButton(1)
      .then(_ => {
        // log to the console
        console.log(mnemonic);
        // loop over all the words and paste them to the input
        for (const _ of mnemonic) {
          cy.get('body')
            .find('span')
            .contains('?')
            .prev()
            .then(span => {
              let index = parseInt(span.text().replace('#', ''), 10);
              // array is 0-indexed
              index--;
              fillDialogInput(0, mnemonic[index]);
              clickDialogButton(1);
            });
        }
      })
      .then(_ => {
        // find the generated ID
        cy.get('body')
          .find('span')
          .contains(
            'A new acccount has been generated, with the following address'
          )
          .parentsUntil('div')
          .parent()
          .next()
          .contains('R')
          .then(p => {
            id = p.text();
            expect(lstore.get('accounts')[0].id).eql(id);
          });
      })
      .then(_ => {
        clickDialogButton(0);
        cy.url().should('contain', `/account/${id}`);
      });
  });
});