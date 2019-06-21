// corrects the int amount from the server to a user-readable float
import moment from 'moment/min/moment-with-locales';
import BigNumber from 'bignumber.js';
import { InjectedIntl } from 'react-intl';
import { isNaN } from 'lodash';
import { Delegate, DelegateInfos } from 'risejs/dist/es5/types/beans';
import { RawAmount } from './amounts';
import bech32 from 'bech32';

// magic...
const epoch = Date.UTC(2016, 4, 24, 17, 0, 0, 0) / 1000;

export function timestampToUnix(timestamp: number) {
  return new Date((timestamp + epoch) * 1000).getTime();
}

export function unixToTimestamp(timestamp: number) {
  return new Date((timestamp - epoch) * 1000).getTime() / 1000;
}

export function normalizeAddress(address: string): string {
  return normalizeAddressV1(address) || normalizeAddressV2(address);
}

export function normalizeAddressV1(address: string): string {
  const normalizedAddress = address.trim().toUpperCase();
  if (!normalizedAddress.match(/^\d{1,20}R$/)) {
    return '';
  } else {
    return normalizedAddress;
  }
}

export function normalizeAddressV2(address: string): string {
  const normalized = address.trim().toLowerCase();
  try {
    bech32.decode(normalized);
    return normalized;
  } catch {
    return '';
  }
}

export function normalizeUsername(value: string): string {
  value = value.trim();

  if (!value.match(/^[a-z0-9!@$&_.]{1,20}$/)) {
    return '';
  }
  // Make sure that the username doesn't resemble an address
  if (normalizeAddress(value) || normalizeAddressV2(value)) {
    return '';
  }

  return value;
}

export function normalizeMnemonic(value: string): string {
  const array = value.trim().split(' ');

  // 12 words
  if (array.length !== 12) {
    return '';
  }

  // only letters
  if (!value.match(/^[\w\s]+$/i)) {
    return '';
  }

  // remove double spaces
  return value.replace(/\s{2,}/g, ' ');
}

export function getTimestamp() {
  return unixToTimestamp(
    moment()
      .utc()
      .unix()
  );
}

/// Normalize the number from user locale format to standard
/// computer float notation
export function normalizeNumber(intl: InjectedIntl, value: string): string {
  const thousandSep = intl.formatNumber(1111).replace(/1/g, '');
  const decimalSep = intl.formatNumber(1.11).replace(/1/g, '');
  value = value.replace(new RegExp(` |\\${thousandSep}`, 'g'), '');
  value = value.replace(new RegExp(`\\${decimalSep}`, 'g'), '.');
  value = value.replace(/(\.\d{1,10})\d*/, '$1');

  try {
    const n = new BigNumber(value);
    if (isNaN(n.toNumber())) {
      return '';
    }
    return n.toString();
  } catch (e) {
    return '';
  }
}

export type TAddressRecord = {
  id: string;
  name: string;
  source: TAddressSource;
};

export enum TAddressSource {
  // eg URL
  PREFILLED,
  // typed by the user
  INPUT,
  // other accounts added to the wallet
  WALLET,
  ADDRESS_BOOK,
  DELEGATE
}

export function isMainnet(domain?: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const location = window.location;
  // web env
  if (
    location &&
    domain &&
    location.hostname.match(new RegExp(`wallet[^.]*.${domain}`))
  ) {
    return true;
  }
  // carlo (desktop) env
  if (typeof carlo !== 'undefined') {
    return true;
  }
  return false;
}

export function formatAmount(
  intl: InjectedIntl,
  amount: RawAmount,
  addSuffix: boolean = true
) {
  const formatted = intl.formatNumber(amount.unit.toNumber(), {
    maximumFractionDigits: 10,
    style: 'decimal'
  });
  return addSuffix ? formatted + ' RISE' : formatted;
}

export function formatFiat(
  intl: InjectedIntl,
  amount: number,
  currency: string
) {
  return intl.formatNumber(amount, {
    maximumFractionDigits: 2,
    style: 'currency',
    currency
  });
}

export type FullDelegate = Delegate & {
  infos: DelegateInfos;
};

export enum AccountIDType {
  OLD = 'v0',
  NEW = 'v1'
}
