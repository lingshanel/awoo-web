import Link from 'next/link';
import type { BoardSummary } from '@/lib/api';
import { getBoardAccent, getBoardDisplayMeta } from '@/lib/board-meta';

export function BoardCard({ board }: { board: BoardSummary }) {
  const meta = getBoardDisplayMeta(board);

  return (
    <Link
      className="board-card"
      href={`/boards/${board.slug}`}
      style={{
        ['--card-accent' as string]: getBoardAccent(board.slug),
      }}
    >
      <div className="board-card-tag">/{board.slug}/</div>
      <div className="board-card-name">{meta.name}</div>
      <div className="board-card-desc">{meta.description || '게시판입니다.'}</div>
      <div className="board-card-meta">
        <span>스레드 {board.threadCount}</span>
        <span>{board.slug === 'game' || board.slug === 'random' ? 'HOT' : 'LIVE'}</span>
      </div>
    </Link>
  );
}
