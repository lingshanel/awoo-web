'use client';

import { useEffect } from 'react';
import { registerThreadView } from '@/lib/api';

export function ThreadViewTracker({ threadId }: { threadId: number }) {
  useEffect(() => {
    const key = `thread-viewed:${threadId}`;

    if (window.sessionStorage.getItem(key)) {
      return;
    }

    window.sessionStorage.setItem(key, '1');
    void registerThreadView(threadId);
  }, [threadId]);

  return null;
}
