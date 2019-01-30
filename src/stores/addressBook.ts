import { observable, computed, action } from 'mobx';
import * as lstore from 'store';

export type TStoredContact = { id: string; name: string };

export default class AddressBookStore {
  // ID -> NAME
  @observable contacts = observable.map<string, string>();

  @computed
  get asArray(): { id: string; name: string }[] {
    return [...this.contacts.entries()].map(([id, name]) => ({
      id,
      name
    }));
  }

  constructor() {
    // restore contacts from memory
    const contacts = lstore.get('contacts') as TStoredContact[];
    if (lstore.get('contacts')) {
      for (const entry of contacts) {
        this.contacts.set(entry.id, entry.name);
      }
    }
    // observe and persist changes
    this.contacts.observe(() => {
      this.persist();
    });
  }

  persist() {
    lstore.set('contacts', this.asArray);
  }

  @action
  setContact(id: string, name: string) {
    this.contacts.set(id, name);
  }

  @action
  removeContact(id: string) {
    this.contacts.delete(id);
  }

  /**
   * Search for contacts starting with [query] and return the IDs.
   *
   * @param query
   */
  search(query: string, maxResults: number = 5): string[] {
    const results = [];
    for (const [id, name] of this.contacts.entries()) {
      if (name.startsWith(query)) {
        results.push(id);
      }
      if (results.length >= maxResults) {
        return results;
      }
    }
    return results;
  }
}
