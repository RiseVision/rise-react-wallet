import { action, observable } from 'mobx';

export default class OnboardingStore {
  @observable address: string | null = null;
  @observable mnemonic: string[] | null = null;

  @action reset() {
    this.address = null;
    this.mnemonic = null;
  }
}
