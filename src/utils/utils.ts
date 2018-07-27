// corrects the int amount from the server to a user-readable float
export function amountToUser(amount: number|string) {
  return parseInt(amount.toString(), 10) / 100000000;
}

export function amountToServer(amount: number|string) {
  return parseInt(amount.toString(), 10) * 100000000;
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