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
  async login(address: string) {
    if (!address) {
      throw Error('address required');
    }
    const res = await this.loadUser(address);
    const account = this.parseAccountReponse(res);
    // TODO detect duplicates
    // alter the store
    runInAction(() => {
      this.accounts.push(account);
    });
    return true;
  }

  parseAccountReponse(res: TAccountResponse): TAccount {
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

  mnemonicToAddress(mnemonic: string[]) {
    const wallet = new LiskWallet(mnemonic.join(' '), 'R');
    return wallet.address;
  }
}

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
