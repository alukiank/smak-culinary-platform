export function parseTimeToMs(expiry: string): number {
  switch (true) {
    case expiry.endsWith('s'):
      return parseInt(expiry) * 1000;
    case expiry.endsWith('m'):
      return parseInt(expiry) * 60 * 1000;
    case expiry.endsWith('h'):
      return parseInt(expiry) * 60 * 60 * 1000;
    case expiry.endsWith('d'):
      return parseInt(expiry) * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}
