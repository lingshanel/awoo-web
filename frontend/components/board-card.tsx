import Link from 'next/link';
import type { BoardSummary } from '@/lib/api';
import { getBoardDisplayMeta } from '@/lib/board-meta';

const boardAccentMap: Record<string, string> = {
  anime: 'var(--board-anime)',
  tech: 'var(--board-tech)',
  cyber: 'var(--board-cyber)',
  game: 'var(--board-game)',
  music: 'var(--board-music)',
  news: 'var(--board-news)',
  random: 'var(--board-random)',
  food: 'var(--board-food)',
  photo: 'var(--board-photo)',
  sports: 'var(--board-sports)',
  study: 'var(--board-study)',
};

export function BoardCard({ board }: { board: BoardSummary }) {
  const meta = getBoardDisplayMeta(board);

  return (
    <Link
      className="board-card"
      href={`/boards/${board.slug}`}
      style={{
        ['--card-accent' as string]: boardAccentMap[board.slug] ?? 'var(--accent)',
      }}
    >
      <div className="board-card-tag">/{board.slug}/</div>
      <div className="board-card-name">{meta.name}</div>
      <div className="board-card-desc">{meta.description || '새 게시판입니다.'}</div>
      <div className="board-card-meta">
        <span>THREADS {board.threadCount}</span>
        <span>{board.slug === 'game' || board.slug === 'random' ? 'HOT' : 'LIVE'}</span>
      </div>
    </Link>
  );
}
