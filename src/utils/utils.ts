// corrects the int amount from the server to a user-readable float
import * as moment from 'moment/min/moment-with-locales';
import BigNumber from 'bignumber.js';
import { InjectedIntl } from 'react-intl';
import { isNaN } from 'lodash';

// magic...
const epoch = Date.UTC(2016, 4, 24, 17, 0, 0, 0) / 1000;

export function timestampToUnix(timestamp: number) {
  return new Date((timestamp + epoch) * 1000).getTime();
}

export function unixToTimestamp(timestamp: number) {
  return new Date((timestamp - epoch) * 1000).getTime() / 1000;
}

export function normalizeAddress(address: string): string {
  const normalizedAddress = address.trim().toUpperCase();
  if (!normalizedAddress.match(/^\d{1,20}R$/)) {
    return '';
  } else {
    return normalizedAddress;
  }
}

export function normalizeUsername(value: string): string {
  value = value.trim();

  if (!value.match(/^[a-z0-9!@$&_.]{1,20}$/)) {
    return '';
  }
  // Make sure that the username doesn't resemble an address
  if (normalizeAddress(value) !== '') {
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
