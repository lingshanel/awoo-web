'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'awoo:cold-start-notice-dismissed';

export function ColdStartNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="cold-start-notice" role="dialog" aria-modal="false" aria-labelledby="cold-start-title">
      <div className="cold-start-header">
        <span id="cold-start-title">첫 접속 안내</span>
        <button type="button" aria-label="안내 닫기" onClick={dismiss}>
          ×
        </button>
      </div>
      <p>
        무료 서버 환경이라 처음 접속하거나 오래 쉬었다가 들어오면 스레드 목록을 불러오는 데
        잠시 시간이 걸릴 수 있습니다. 한 번 깨어난 뒤에는 더 빠르게 동작합니다.
      </p>
    </div>
  );
}
