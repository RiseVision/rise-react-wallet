import * as lstore from 'store';
import { stub, mockStoredContacts } from '../utils/testHelpers';
import AddressBookStore from './addressBook';
import { storedContacts } from './fixtures';

let stubs: any[];

beforeEach(() => {
  // array to keep stubs to restore them later
  stubs = [];
});

afterEach(() => {
  lstore.clearAll();
  // check if a test has failed
  if (!stubs) return;
  // dispose all the stubs
  for (const stub of stubs) {
    stub.restore();
  }
});

describe('constructor', () => {
  it('reads from localStorage', () => {
    mockStoredContacts(storedContacts);
    const book = new AddressBookStore();
    expect(book.contacts.size).toEqual(storedContacts.length);
    for (const { id, name } of storedContacts) {
      expect(book.contacts.get(id)).toEqual(name);
    }
  });

  it('observes for changes', () => {
    const book = new AddressBookStore();
    let contact = storedContacts[0];
    stub(stubs, book, 'persist', () => {});
    book.contacts.set(contact.id, contact.name);
    // @ts-ignore sinon stub
    expect(book.persist.called).toBeTruthy();
  });
});

describe('address book', () => {
  let book: AddressBookStore;
  beforeEach(() => {
    mockStoredContacts(storedContacts);
    book = new AddressBookStore();
  });

  it('persist', () => {
    const id = '123R';
    const name = 'test';
    book.contacts.set(id, name);
    const stored = lstore.get('contacts');
    expect(stored.some(c => c.id === id && c.name === name)).toBeTruthy();
  });

  it('setContact', () => {
    const id = '123R';
    const name = 'test';
    book.setContact(id, name);
    expect(book.contacts.get(id)).toEqual(name);
  });

  it('removeContact', () => {
    const id = storedContacts[0].id;
    book.removeContact(id);
    expect(book.contacts.size).toEqual(storedContacts.length - 1);
  });

  it('asArray', () => {
    const array = book.asArray;
    expect(array).toHaveLength(storedContacts.length);
    for (const { id, name } of storedContacts) {
      expect(array.find(c => c.id === id && c.name === name));
    }
  });
  it('search', () => {
    const results = book.search('test');
    expect(results).toHaveLength(2);
  });
});
