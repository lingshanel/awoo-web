import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 32;

export function hashOwnerPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');

  return `scrypt:${salt}:${hash}`;
}

export function verifyOwnerPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false;
  }

  const [scheme, salt, hash] = storedHash.split(':');
  if (scheme !== 'scrypt' || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
