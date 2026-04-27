'use client';

import { useEffect } from 'react';
import { registerThreadView, type ThreadListItem } from '@/lib/api';
import { addViewedThread } from '@/lib/thread-activity';

export function ThreadViewTracker({
  thread,
}: {
  thread: Pick<
    ThreadListItem,
    'id' | 'board' | 'title' | 'replyCount' | 'viewCount' | 'likeCount' | 'createdAt'
  >;
}) {
  useEffect(() => {
    addViewedThread(thread);

    const key = `thread-viewed:${thread.id}`;

    if (window.sessionStorage.getItem(key)) {
      return;
    }

    window.sessionStorage.setItem(key, '1');
    void registerThreadView(thread.id);
  }, [thread]);

  return null;
}
