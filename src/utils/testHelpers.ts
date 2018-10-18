import * as sinon from 'sinon';
import * as lstore from 'store';
import { TStoredContact } from '../stores/addressBook';
import { TStoredAccount } from '../stores/wallet';

export function mockStoredAccounts(accounts: TStoredAccount[]) {
  lstore.set('accounts', accounts);
}

export function mockStoredContacts(contacts: TStoredContact[]) {
  lstore.set('contacts', contacts);
}

export function stub<T>(
  stubs: Function[],
  object: T,
  method: keyof T,
  // tslint:disable-next-line:no-any
  fn: (...args: any[]) => void
) {
  stubs.push(sinon.stub(object, method).callsFake(fn));
}
