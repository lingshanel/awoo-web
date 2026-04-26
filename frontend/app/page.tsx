import Link from 'next/link';
import { AdSlot } from '@/components/ad-slot';
import { BoardCard } from '@/components/board-card';
import { NoticeTicker } from '@/components/notice-ticker';
import { ThreadCard } from '@/components/thread-card';
import { getBoards, getRecentThreads, type BoardSummary } from '@/lib/api';
import { getBoardDisplayMeta } from '@/lib/board-meta';

const ALL_BOARD: BoardSummary = {
  id: 0,
  slug: 'all',
  name: '전체',
  description: '모든 카테고리의 스레드 모아보기',
  threadCount: 0,
};

export default async function HomePage() {
  const boards = await getBoards();
  const latestThreads = await getRecentThreads('latest', 8);
  const recentThreads = latestThreads.items.slice(0, 8);
  const displayBoards = [...boards.items, { ...ALL_BOARD, threadCount: latestThreads.pagination.total }];

  return (
    <div className="page-body">
      <main className="main-column">
        <section className="hero">
          <div className="hero-title">
            AWOO<span>/KR</span>
          </div>
          <div className="hero-sub">
            // 익명 보드 스타일 커뮤니티. 가볍게 들어와 바로 이야기할 수 있습니다.
          </div>
          <NoticeTicker />
        </section>

        <div className="notice">
          새 카테고리와 공지사항이 열려 있습니다. 첫 스레드와 첫 댓글로 분위기를 만들어 보세요.
        </div>

        <form className="search-bar" action="/search">
          <input
            aria-label="스레드 검색어"
            name="q"
            placeholder="제목이나 본문으로 스레드 검색"
          />
          <button type="submit">
            검색
          </button>
        </form>

        <div className="section-header">카테고리 목록</div>
        <div className="board-grid">
          {displayBoards.map((board) => (
            <BoardCard key={board.slug} board={board} />
          ))}
        </div>

        <div className="section-header">최근 스레드</div>
        <div className="thread-list">
          {recentThreads.length ? (
            recentThreads.map((thread, index) => (
              <ThreadCard key={thread.id} featured={index === 0} thread={thread} />
            ))
          ) : (
            <div className="thread-card">
              <div className="thread-num">#00</div>
              <div>
                <div className="thread-title">아직 등록된 스레드가 없습니다.</div>
                <div className="thread-preview">`/write`에서 첫 스레드를 작성해 보세요.</div>
              </div>
              <div className="thread-thumb-col">
                <div className="thumb-placeholder">[]</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <Link className="plain-link center-link" href="/boards/all?sort=latest">
            전체 스레드 보기
          </Link>
        </div>
      </main>

      <aside className="sidebar">
        <div className="sidebar-widget" style={{ padding: 8, textAlign: 'center' }}>
          <AdSlot variant="side" />
        </div>
        <div className="sidebar-widget">
          <h3>// 카테고리</h3>
          <ul className="board-quick-list">
            {displayBoards.map((board) => (
              <li key={board.slug}>
                <Link href={`/boards/${board.slug}`}>
                  <span className="tag">/{board.slug}/</span>
                  {getBoardDisplayMeta(board).name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="sidebar-widget">
          <h3>// 통계</h3>
          <div className="stat-row">
            <span>활성 카테고리</span>
            <span className="val">{boards.total}</span>
          </div>
          <div className="stat-row">
            <span>표시 중인 스레드</span>
            <span className="val">{latestThreads.pagination.total}</span>
          </div>
          <div className="stat-row">
            <span>스택</span>
            <span className="val">NEXT+NEST</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
