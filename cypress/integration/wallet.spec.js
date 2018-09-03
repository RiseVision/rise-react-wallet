/// <reference types="Cypress" />
import delay from 'delay';
import lstore from 'store';

// TODO move to fixtures
const fixtures = {
  id: '12525095472804841547R',
  mnemonic:
    'cable swamp sauce release kitchen build torch midnight foot silk subway deliver',
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

context('Onboarding', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/').then(() => {
      lstore.set('accounts', [fixtures.account]);
      lstore.set('lastSelectedAccount', fixtures.account.id);
      // localStorage.setItem('lastSelectedAccount')
      cy.visit('http://localhost:3000/');
    });
  });

  // afterEach(() => {
  //   lstore.clearAll();
  // });

  it('send funds', async () => {
    // click the Send RISE button
    cy.get('button[title="Send RISE"]').click();
    // type in the recipient address
    cy.get('div[role="dialog"]')
      .find('input')
      .eq(0)
      .type(fixtures2.id);
    // type in the amount
    cy.get('div[role="dialog"]')
      .find('input')
      .eq(1)
      .type('2');
    // click submit
    cy.get('div[role="dialog"]')
      .find('button[type="submit"]')
      .click();
  });
});
