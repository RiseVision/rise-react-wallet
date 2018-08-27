// corrects the int amount from the server to a user-readable float
import * as moment from 'moment-timezone';
import BigNumber from 'bignumber.js';
import { InjectedIntl } from 'react-intl';

// magic...
const epoch = Date.UTC(2016, 4, 24, 17, 0, 0, 0) / 1000;

export function timestampToUnix(timestamp: number) {
  return new Date((timestamp + epoch) * 1000).getTime();
}

export function unixToTimestamp(timestamp: number) {
  return new Date((timestamp - epoch) * 1000).getTime() / 1000;
}

export function normalizeAddress(address: string): string {
  const normalizedAddress = address.toUpperCase();
  if (!normalizedAddress.match(/^\d{1,20}R$/)) {
    return '';
  } else {
    return normalizedAddress;
  }
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
    return n.toString();
  } catch (e) {
    return '';
  }
}
