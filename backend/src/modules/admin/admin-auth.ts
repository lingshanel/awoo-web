import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SESSION_COOKIE_NAME = 'awoo_admin_session';
const CSRF_COOKIE_NAME = 'awoo_admin_csrf';
const PASSWORD_PREFIX = 'scrypt';
const SCRYPT_KEY_LENGTH = 64;

export function getAdminSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getAdminCsrfCookieName() {
  return CSRF_COOKIE_NAME;
}

export function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');

  return `${PASSWORD_PREFIX}:${salt}:${derivedKey}`;
}

export function verifyAdminPassword(password: string, storedHash: string) {
  const [prefix, salt, key] = storedHash.split(':');

  if (prefix !== PASSWORD_PREFIX || !salt || !key) {
    return false;
  }

  const expected = Buffer.from(key, 'hex');
  const actual = scryptSync(password, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSecureToken() {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function parseCookie(header: string | undefined, name: string) {
  if (!header) {
    return undefined;
  }

  const cookie = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined;
}

function buildCookie(name: string, value: string, maxAgeSeconds: number, httpOnly: boolean) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const httpOnlyFlag = httpOnly ? '; HttpOnly' : '';

  return [
    `${name}=${encodeURIComponent(value)}`,
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAgeSeconds}`,
    httpOnlyFlag,
    secure,
  ]
    .filter(Boolean)
    .join('; ');
}

export function buildAdminSessionCookie(token: string, maxAgeSeconds: number) {
  return buildCookie(SESSION_COOKIE_NAME, token, maxAgeSeconds, true);
}

export function buildAdminCsrfCookie(token: string, maxAgeSeconds: number) {
  return buildCookie(CSRF_COOKIE_NAME, token, maxAgeSeconds, false);
}

export function buildClearAdminSessionCookie() {
  return buildCookie(SESSION_COOKIE_NAME, '', 0, true);
}

export function buildClearAdminCsrfCookie() {
  return buildCookie(CSRF_COOKIE_NAME, '', 0, false);
}

export function timingSafeTokenEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}
