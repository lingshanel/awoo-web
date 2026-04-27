import type { ThreadListItem } from './api';

export type StoredThreadActivityItem = {
  id: number;
  boardSlug: string;
  boardName: string;
  title: string;
  replyCount: number;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  savedAt: string;
};

const VIEWED_THREADS_KEY = 'awoo:viewed-threads';
const OWNED_THREADS_KEY = 'awoo:owned-threads';
const MAX_ITEMS = 12;

type TrackableThread = Pick<
  ThreadListItem,
  'id' | 'board' | 'title' | 'replyCount' | 'viewCount' | 'likeCount' | 'createdAt'
>;

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function readItems(key: string): StoredThreadActivityItem[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeItems(key: string, items: StoredThreadActivityItem[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(items.slice(0, MAX_ITEMS)));
  window.dispatchEvent(new CustomEvent('awoo-thread-activity-change'));
}

function toStoredItem(thread: TrackableThread): StoredThreadActivityItem {
  return {
    id: thread.id,
    boardSlug: thread.board.slug,
    boardName: thread.board.name,
    title: thread.title,
    replyCount: thread.replyCount,
    viewCount: thread.viewCount,
    likeCount: thread.likeCount,
    createdAt: thread.createdAt,
    savedAt: new Date().toISOString(),
  };
}

function upsertItem(key: string, item: StoredThreadActivityItem) {
  writeItems(key, [item, ...readItems(key).filter((current) => current.id !== item.id)]);
}

export function addViewedThread(thread: TrackableThread) {
  upsertItem(VIEWED_THREADS_KEY, toStoredItem(thread));
}

export function addOwnedThread(thread: TrackableThread) {
  upsertItem(OWNED_THREADS_KEY, toStoredItem(thread));
}

export function getViewedThreads() {
  return readItems(VIEWED_THREADS_KEY);
}

export function getOwnedThreads() {
  return readItems(OWNED_THREADS_KEY);
}

export function clearThreadActivity(kind: 'viewed' | 'owned') {
  writeItems(kind === 'viewed' ? VIEWED_THREADS_KEY : OWNED_THREADS_KEY, []);
}
