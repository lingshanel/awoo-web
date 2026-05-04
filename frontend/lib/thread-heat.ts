import type { ThreadListItem } from './api';

type HotThreshold = {
  minLikes: number;
  minViews: number;
  strongLikes: number;
  strongViews: number;
};

const DEFAULT_HOT_THRESHOLD: HotThreshold = {
  minLikes: 5,
  minViews: 140,
  strongLikes: 10,
  strongViews: 280,
};

const BOARD_HOT_THRESHOLDS: Partial<Record<string, HotThreshold>> = {
  anime: {
    minLikes: 5,
    minViews: 160,
    strongLikes: 10,
    strongViews: 320,
  },
  tech: {
    minLikes: 4,
    minViews: 130,
    strongLikes: 9,
    strongViews: 260,
  },
  cyber: {
    minLikes: 4,
    minViews: 130,
    strongLikes: 9,
    strongViews: 260,
  },
  game: {
    minLikes: 6,
    minViews: 170,
    strongLikes: 12,
    strongViews: 340,
  },
  music: {
    minLikes: 4,
    minViews: 120,
    strongLikes: 9,
    strongViews: 240,
  },
  news: {
    minLikes: 4,
    minViews: 180,
    strongLikes: 8,
    strongViews: 360,
  },
  photo: {
    minLikes: 5,
    minViews: 130,
    strongLikes: 9,
    strongViews: 260,
  },
  random: {
    minLikes: 4,
    minViews: 110,
    strongLikes: 8,
    strongViews: 220,
  },
};

function getHotThreshold(boardSlug: string): HotThreshold {
  return BOARD_HOT_THRESHOLDS[boardSlug] ?? DEFAULT_HOT_THRESHOLD;
}

export function isHotThread(thread: ThreadListItem) {
  if (thread.isPinned) {
    return false;
  }

  const threshold = getHotThreshold(thread.board.slug);
  const hasBaselineMomentum =
    thread.likeCount >= threshold.minLikes && thread.viewCount >= threshold.minViews;
  const strongLikeSignal = thread.likeCount >= threshold.strongLikes;
  const strongViewSignal = thread.viewCount >= threshold.strongViews;

  return hasBaselineMomentum || strongLikeSignal || strongViewSignal;
}

