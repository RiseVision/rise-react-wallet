import sinon from 'sinon';
import { TStoredContact } from '../stores/addressBook';
import { TStoredAccount } from '../stores/wallet';
import lstore from '../utils/store';

export function mockStoredAccounts(accounts: TStoredAccount[]) {
  lstore.set('accounts', accounts);
}

export function mockStoredContacts(contacts: TStoredContact[]) {
  lstore.set('contacts', contacts);
}

/**
 * Stubs the specified functions and adds it to the stubs array for later
 * restoration. Supports betters with `isGetter`.
 *
 * @param stubs
 * @param object
 * @param method
 * @param fn
 * @param isGetter
 */
export function stub<T>(
  stubs: Function[],
  object: T,
  method: keyof T,
  // tslint:disable-next-line:no-any
  fn: (...args: any[]) => void,
  isGetter: boolean = false
) {
  const toStub = sinon.stub(object, method);
  // @ts-ignore
  const ret = isGetter ? toStub.get(fn) : toStub.callsFake(fn);
  stubs.push(ret);
  return ret;
}
