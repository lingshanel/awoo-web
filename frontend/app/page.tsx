import Link from 'next/link';
import { BoardCard } from '@/components/board-card';
import { NoticeTicker } from '@/components/notice-ticker';
import { ThreadCard } from '@/components/thread-card';
import { getBoards, getRecentThreads, type BoardSummary } from '@/lib/api';
import { getBoardDisplayMeta } from '@/lib/board-meta';

const ALL_BOARD: BoardSummary = {
  id: 0,
  slug: 'all',
  name: '전체',
  description: '모든 게시판 스레드 모아보기',
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
          새 게시판과 공지사항이 열려 있습니다. 첫 글과 첫 댓글로 분위기를 만들어 보세요.
        </div>

        <div className="search-bar search-bar-static">
          <input
            aria-label="통합 검색 준비 중"
            placeholder="통합 검색은 다음 단계에서 연결될 예정입니다."
            readOnly
          />
          <button disabled type="button">
            준비 중
          </button>
        </div>

        <div className="section-header">게시판 목록</div>
        <div className="board-grid">
          {displayBoards.map((board) => (
            <BoardCard key={board.slug} board={board} />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
          <div className="ad-slot ad-slot-inline" style={{ maxWidth: 728 }}>
            [ 광고 영역 / 728x60 배너 ]
          </div>
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
                <div className="thread-preview">`/write`에서 첫 글을 작성해 보세요.</div>
              </div>
              <div className="thread-thumb-col">
                <div className="thumb-placeholder">[]</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <Link className="plain-link center-link" href="/boards/all?sort=latest">
            전체 게시판 스레드 보기
          </Link>
        </div>
      </main>

      <aside className="sidebar">
        <div className="sidebar-widget" style={{ padding: 8, textAlign: 'center' }}>
          <div className="ad-slot ad-slot-side">[ 광고 160x250 ]</div>
        </div>
        <div className="sidebar-widget">
          <h3>// 게시판</h3>
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
            <span>활성 게시판</span>
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
