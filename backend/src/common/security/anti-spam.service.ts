import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class AntiSpamService {
  private readonly windows = new Map<string, number[]>();
  private readonly contentWindows = new Map<string, Array<{ hash: string; timestamp: number }>>();

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

  enforceContentQuality(key: string, content: string) {
    const normalized = content.replace(/\s+/g, ' ').trim().toLowerCase();
    const linkCount = (normalized.match(/https?:\/\//g) ?? []).length;

    if (linkCount >= 4) {
      throw new HttpException(
        '링크가 너무 많습니다. 광고/도배 방지를 위해 링크 수를 줄여 주세요.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (normalized.length < 8) {
      return;
    }

    const now = Date.now();
    const hash = this.hashContent(normalized);
    const entries = (this.contentWindows.get(key) ?? []).filter(
      (entry) => now - entry.timestamp < 5 * 60 * 1000,
    );

    if (entries.some((entry) => entry.hash === hash)) {
      throw new HttpException(
        '같은 내용을 짧은 시간 안에 반복해서 작성할 수 없습니다.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entries.push({ hash, timestamp: now });
    this.contentWindows.set(key, entries);
  }

  private hashContent(value: string) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }

    return hash.toString(16);
  }
}
