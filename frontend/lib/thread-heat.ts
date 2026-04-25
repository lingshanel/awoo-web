import type { ThreadListItem } from './api';

type HotThreshold = {
  minLikes: number;
  minViews: number;
  strongLikes: number;
  strongViews: number;
};

const DEFAULT_HOT_THRESHOLD: HotThreshold = {
  minLikes: 3,
  minViews: 80,
  strongLikes: 6,
  strongViews: 160,
};

const BOARD_HOT_THRESHOLDS: Partial<Record<string, HotThreshold>> = {
  anime: {
    minLikes: 3,
    minViews: 90,
    strongLikes: 6,
    strongViews: 180,
  },
  tech: {
    minLikes: 2,
    minViews: 70,
    strongLikes: 5,
    strongViews: 140,
  },
  cyber: {
    minLikes: 2,
    minViews: 70,
    strongLikes: 5,
    strongViews: 135,
  },
  game: {
    minLikes: 4,
    minViews: 95,
    strongLikes: 7,
    strongViews: 190,
  },
  music: {
    minLikes: 2,
    minViews: 60,
    strongLikes: 5,
    strongViews: 130,
  },
  news: {
    minLikes: 2,
    minViews: 110,
    strongLikes: 4,
    strongViews: 220,
  },
  photo: {
    minLikes: 3,
    minViews: 75,
    strongLikes: 5,
    strongViews: 150,
  },
  random: {
    minLikes: 2,
    minViews: 55,
    strongLikes: 4,
    strongViews: 120,
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

