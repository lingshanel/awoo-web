'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  clearThreadActivity,
  getOwnedThreads,
  getViewedThreads,
  type StoredThreadActivityItem,
} from '@/lib/thread-activity';
import { formatKoreanDateTime } from '@/lib/date-format';

function formatSavedAt(value: string) {
  return formatKoreanDateTime(value);
}

function HistoryList({
  emptyText,
  items,
}: {
  emptyText: string;
  items: StoredThreadActivityItem[];
}) {
  if (!items.length) {
    return <div className="history-empty">{emptyText}</div>;
  }

  return (
    <ul className="history-list">
      {items.slice(0, 5).map((item) => (
        <li key={item.id}>
          <Link href={`/threads/${item.id}`}>
            <span className="history-board">/{item.boardSlug}/</span>
            <span className="history-title">{item.title}</span>
            <span className="history-meta">
              댓글 {item.replyCount} · 추천 {item.likeCount} · {formatSavedAt(item.savedAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function UserThreadHistory() {
  const [viewedThreads, setViewedThreads] = useState<StoredThreadActivityItem[]>([]);
  const [ownedThreads, setOwnedThreads] = useState<StoredThreadActivityItem[]>([]);

  useEffect(() => {
    function syncItems() {
      setViewedThreads(getViewedThreads());
      setOwnedThreads(getOwnedThreads());
    }

    syncItems();
    window.addEventListener('storage', syncItems);
    window.addEventListener('awoo-thread-activity-change', syncItems);

    return () => {
      window.removeEventListener('storage', syncItems);
      window.removeEventListener('awoo-thread-activity-change', syncItems);
    };
  }, []);

  return (
    <div className="history-panel">
      <section className="history-section">
        <div className="history-header">
          <h3>// 최근 본 글</h3>
          {viewedThreads.length ? (
            <button type="button" onClick={() => clearThreadActivity('viewed')}>
              지우기
            </button>
          ) : null}
        </div>
        <HistoryList emptyText="아직 본 글이 없습니다." items={viewedThreads} />
      </section>
      <section className="history-section">
        <div className="history-header">
          <h3>// 내가 쓴 글</h3>
          {ownedThreads.length ? (
            <button type="button" onClick={() => clearThreadActivity('owned')}>
              지우기
            </button>
          ) : null}
        </div>
        <HistoryList emptyText="이 브라우저에서 작성한 글이 없습니다." items={ownedThreads} />
      </section>
    </div>
  );
}
