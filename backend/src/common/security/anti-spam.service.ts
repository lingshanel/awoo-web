import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class AntiSpamService {
  private readonly windows = new Map<string, number[]>();

  enforceCooldown(key: string, cooldownMs: number, limit = 1) {
    const now = Date.now();
    const entries = (this.windows.get(key) ?? []).filter(
      (timestamp) => now - timestamp < cooldownMs,
    );

    if (entries.length >= limit) {
      const retryAfterMs = cooldownMs - (now - entries[0]);
      const retryAfter = Math.max(1, Math.ceil(retryAfterMs / 1000));
      throw new HttpException(
        `요청이 너무 빠릅니다. 약 ${retryAfter}초 후에 다시 시도해 주세요.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entries.push(now);
    this.windows.set(key, entries);
  }
}
