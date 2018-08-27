// corrects the int amount from the server to a user-readable float
import * as moment from 'moment-timezone';
import { InjectedIntl } from 'react-intl';

export function amountToUser(amount: number | string) {
  return parseInt(amount.toString(), 10) / 100000000;
}

export function amountToServer(amount: number) {
  return Math.trunc(amount * 100000000);
}

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

/// Try to parse number entered in users locale
export function parseNumber(intl: InjectedIntl, value: string): number | null {
  const thousandSep = intl.formatNumber(1111).replace(/1/g, '');
  const decimalSep = intl.formatNumber(1.11).replace(/1/g, '');
  value = value.replace(new RegExp(` |\\${thousandSep}`, 'g'), '');
  value = value.replace(new RegExp(`\\${decimalSep}`, 'g'), '.');
  const n = parseFloat(value);

  if (isNaN(n) || n.toString() !== value) {
    return null;
  } else {
    return n;
  }
}
