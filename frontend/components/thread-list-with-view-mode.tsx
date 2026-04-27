'use client';

import { useEffect, useState } from 'react';
import type { ThreadListItem } from '@/lib/api';
import { ThreadCard } from './thread-card';

type ViewMode = 'detail' | 'compact';

const VIEW_MODE_KEY = 'awoo:thread-list-view-mode';

export function ThreadListWithViewMode({ threads }: { threads: ThreadListItem[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('detail');

  useEffect(() => {
    const storedMode = window.localStorage.getItem(VIEW_MODE_KEY);
    if (storedMode === 'compact' || storedMode === 'detail') {
      setViewMode(storedMode);
    }
  }, []);

  function changeViewMode(nextMode: ViewMode) {
    setViewMode(nextMode);
    window.localStorage.setItem(VIEW_MODE_KEY, nextMode);
  }

  return (
    <div className="thread-list-block">
      <div className="list-view-controls" aria-label="게시글 목록 보기 방식">
        <button
          className={viewMode === 'detail' ? 'active' : ''}
          type="button"
          onClick={() => changeViewMode('detail')}
        >
          자세히
        </button>
        <button
          className={viewMode === 'compact' ? 'active' : ''}
          type="button"
          onClick={() => changeViewMode('compact')}
        >
          간단히
        </button>
      </div>
      <div className={`thread-list ${viewMode === 'compact' ? 'thread-list-compact' : ''}`}>
        {threads.map((thread) => (
          <ThreadCard key={thread.id} compact={viewMode === 'compact'} thread={thread} />
        ))}
      </div>
    </div>
  );
}
