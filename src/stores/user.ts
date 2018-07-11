import { LiskWallet } from 'dpos-offline';
import { action, observable, configure, runInAction } from 'mobx';
import { Locale } from '../utils/i18n';
import Store from './store';

// make sure only actions modify the store
configure({ enforceActions: true });

export default class UserStore {
  api: string;

  @observable accounts = observable.array<TAccount>();

  constructor(public app: Store) {
    this.api = app.config.api_url;
    for (const account of this.storeadAccounts()) {
      this.login(account.id, account.readOnly);
    }
    // TODO load accounts from user storage
  }

  /**
   * Returns the list of stored account IDs.
   */
  storeadAccounts(): TStoredAccount[] {
    return JSON.parse(localStorage.getItem('accounts') || '[]');
  }

  rememberAccount(account: TStoredAccount) {
    let accounts = this.storeadAccounts();
    // check for duplicates
    if (!accounts.find(a => a.id === account.id)) {
      accounts.push(account);
      localStorage.setItem('accounts', JSON.stringify(accounts));
    }
  }

  async loadUser(id: string): Promise<TAccountResponse> {
    const res = await fetch(`${this.api}/api/accounts?address=${id}`);
    const json: TAccountResponse | TErrorResponse = await res.json();
    if (!json.success) {
      throw new Error((json as TErrorResponse).error);
    }
    return json;
  }

  @action
  async login(address: string, readOnly: boolean = false) {
    if (!address) {
      throw Error('address required');
    }
    const res = await this.loadUser(address);
    const account = parseAccountReponse(res);
    // TODO detect duplicates
    // alter the store
    runInAction(() => {
      this.accounts.push(account);
    });
    this.rememberAccount({ id: address, readOnly });
    return true;
  }
}

export function parseAccountReponse(res: TAccountResponse): TAccount {
  return {
    id: res.account.address,
    publicKey: res.account.publicKey,
    // TODO
    name: '',
    // TODO
    mnemonic: '',
    // TODO
    mnemonic2: '',
    // TODO
    fiatCurrency: 'USD',
    pinned: false,
    balance: parseInt(res.account.balance, 10) / 100000000,
    unconfirmedBalance:
      parseInt(res.account.unconfirmedBalance, 10) / 100000000,
    _balance: parseInt(res.account.balance, 10),
    _unconfirmedBalance: parseInt(res.account.unconfirmedBalance, 10)
  };
}

export function mnemonicToAddress(mnemonic: string[]) {
  const wallet = new LiskWallet(mnemonic.join(' '), 'R');
  return wallet.address;
}

export type TStoredAccount = {
  id: string;
  readOnly: boolean;
};

export type TAccount = {
  id: string;
  publicKey: string;
  name: string;
  mnemonic: string;
  mnemonic2: string;
  fiatCurrency: string;
  pinned: boolean;
  balance: number;
  unconfirmedBalance: number;
  _balance: number;
  _unconfirmedBalance: number;
  // voted_delegate: string,
};

export type TAccountResponse = {
  account: {
    address: string;
    balance: string;
    // tslint:disable-next-line:no-any
    multisignatures: any[];
    publicKey: string;
    secondPublicKey: string | null;
    secondSignature: number;
    // tslint:disable-next-line:no-any
    u_multisignatures: any[];
    unconfirmedBalance: string;
    unconfirmedSignature: number;
  };
  success: true;
};

export type TErrorResponse = {
  error: string;
  success: false;
};
