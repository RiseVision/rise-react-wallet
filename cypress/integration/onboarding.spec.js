/// <reference types="Cypress" />
import delay from 'delay';

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

context('Onboarding', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/');
  });

  afterEach( () => {
    // TODO clean local storage
  })

  it('add an existing account', async () => {
    // check the url
    cy.url().should('contain', 'onboarding/add-account');
    // click "Existing account"
    cy.get('body')
      .find('div')
      .contains('Existing account')
      .click();
    // enter the ID
    cy.get('input').type('12525095472804841547R');
    // submit
    cy.get('button[type="submit"]').click();
    // choose Full access and wait for the wallet page
    await new Promise(then => {
      cy.get('body')
        .find('div')
        .contains('Full access account')
        .click()
        .then(then);
    });
    // wait for the recent transaction list
    await delay(2000);
    expect(JSON.parse(localStorage.accounts)[0]).to.deep.eq(fixtures.account);
  });
});
