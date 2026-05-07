const KOREA_TIME_ZONE = 'Asia/Seoul';

export function formatKoreanDateTime(value: string, options: { includeYear?: boolean } = {}) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KOREA_TIME_ZONE,
    year: options.includeYear ? 'numeric' : undefined,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}
