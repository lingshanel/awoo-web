import { BadRequestException, Injectable } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const CAPTCHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function getCaptchaSecret() {
  const secret = process.env.CAPTCHA_SECRET;

  if (!secret || secret.length < 32 || secret === 'replace-with-a-long-random-secret') {
    throw new Error('CAPTCHA_SECRET must be set to a unique secret with at least 32 characters.');
  }

  return secret;
}

type CaptchaTokenPayload = {
  expiresAt: number;
  nonce: string;
  codeHash: string;
};

@Injectable()
export class CaptchaService {
  private readonly usedNonces = new Map<string, number>();

  createChallenge() {
    const code = this.createCode();
    const nonce = randomBytes(12).toString('hex');
    const ttlSeconds = Number(process.env.CAPTCHA_TTL_SECONDS ?? 300);
    const payload: CaptchaTokenPayload = {
      expiresAt: Date.now() + ttlSeconds * 1000,
      nonce,
      codeHash: this.createCodeHash(nonce, code),
    };

    return {
      code,
      token: this.signPayload(payload),
      expiresAt: new Date(payload.expiresAt).toISOString(),
    };
  }

  verify(token: string, answer: string) {
    const payload = this.readPayload(token);
    const normalizedAnswer = answer.trim().toUpperCase();

    this.pruneUsedNonces();

    if (!normalizedAnswer || payload.expiresAt < Date.now()) {
      throw new BadRequestException('Captcha answer is incorrect.');
    }

    if (this.usedNonces.has(payload.nonce)) {
      throw new BadRequestException('Captcha answer is incorrect.');
    }

    if (!this.safeEqual(payload.codeHash, this.createCodeHash(payload.nonce, normalizedAnswer))) {
      throw new BadRequestException('Captcha answer is incorrect.');
    }

    this.usedNonces.set(payload.nonce, payload.expiresAt);
  }

  private createCode() {
    return Array.from({ length: 5 }, () => {
      const index = Math.floor(Math.random() * CAPTCHA_CHARS.length);
      return CAPTCHA_CHARS[index];
    }).join('');
  }

  private signPayload(payload: CaptchaTokenPayload) {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encodedPayload}.${this.createSignature(encodedPayload)}`;
  }

  private readPayload(token: string): CaptchaTokenPayload {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature || !this.safeEqual(signature, this.createSignature(encodedPayload))) {
      throw new BadRequestException('Captcha answer is incorrect.');
    }

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as CaptchaTokenPayload;

      if (
        typeof payload.expiresAt !== 'number' ||
        typeof payload.nonce !== 'string' ||
        typeof payload.codeHash !== 'string'
      ) {
        throw new Error('Invalid captcha payload.');
      }

      return payload;
    } catch {
      throw new BadRequestException('Captcha answer is incorrect.');
    }
  }

  private createCodeHash(nonce: string, code: string) {
    return this.hmac(`${nonce}:${code}`);
  }

  private createSignature(encodedPayload: string) {
    return this.hmac(encodedPayload);
  }

  private hmac(value: string) {
    return createHmac('sha256', getCaptchaSecret())
      .update(value)
      .digest('hex');
  }

  private safeEqual(left: string, right: string) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }

  private pruneUsedNonces() {
    const now = Date.now();

    for (const [nonce, expiresAt] of this.usedNonces) {
      if (expiresAt < now) {
        this.usedNonces.delete(nonce);
      }
    }
  }
}
