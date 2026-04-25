import { createHash } from 'crypto';

export function hashValue(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function createAuthorHash(name?: string, email?: string) {
  const raw = `${name ?? 'anonymous'}|${email ?? ''}`;
  return hashValue(raw).slice(0, 16);
}
