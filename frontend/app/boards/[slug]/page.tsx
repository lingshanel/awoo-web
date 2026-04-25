import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ThreadCard } from '@/components/thread-card';
import { getBoardThreads, getBoards, getRecentThreads, type BoardSummary } from '@/lib/api';
import { getBoardDisplayMeta } from '@/lib/board-meta';

type BoardPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: 'latest' | 'popular' | 'views'; page?: string }>;
};

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'views', label: '조회순' },
] as const;

const ALL_BOARD: BoardSummary = {
  id: 0,
  slug: 'all',
  name: '전체',
  description: '모든 게시판 스레드 모아보기',
  threadCount: 0,
};

function buildBoardHref(slug: string, sort: string, page: number) {
  return `/boards/${slug}?sort=${sort}&page=${page}`;
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const sort: 'latest' | 'popular' | 'views' = SORT_OPTIONS.some(
    (option) => option.value === resolvedSearchParams.sort,
  )
    ? (resolvedSearchParams.sort as 'latest' | 'popular' | 'views')
    : 'latest';
  const page = Math.max(1, Number(resolvedSearchParams.page ?? '1') || 1);

  try {
    const boards = await getBoards();
    const sidebarBoards = [...boards.items, { ...ALL_BOARD, threadCount: 0 }];

    const data =
      slug === 'all'
        ? await getRecentThreads(sort, 20, page).then((result) => ({
            board: { ...ALL_BOARD, threadCount: result.pagination.total },
            items: result.items,
            pagination: result.pagination,
          }))
        : await getBoardThreads(slug, sort, page);

    const boardMeta = getBoardDisplayMeta(data.board);

    return (
      <div className="page-body">
        <main className="main-column">
          <section className="board-header">
            <div>
              <div className="board-tag">/{data.board.slug}/</div>
              <div className="board-name">
                // {boardMeta.name}
                {boardMeta.description ? ` · ${boardMeta.description}` : ''}
              </div>
            </div>
            <div className="board-stats">
              <div className="board-stat">
                <span className="val">{data.board.threadCount}</span>
                <span>THREADS</span>
              </div>
              <div className="board-stat">
                <span className="val">{data.pagination.total}</span>
                <span>VISIBLE</span>
              </div>
              <div className="board-stat">
                <span className="val">
                  {sort === 'latest' ? 'NEW' : sort === 'popular' ? 'HOT' : 'VIEW'}
                </span>
                <span>SORT</span>
              </div>
            </div>
          </section>

          <div className="board-controls">
            <div className="sort-tabs">
              {SORT_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  className={`toolbar-button ${sort === option.value ? 'active' : ''}`}
                  href={buildBoardHref(slug, option.value, 1)}
                >
                  {option.label}
                </Link>
              ))}
            </div>
            {slug !== 'all' ? (
              <Link className="submit-btn primary" href={`/write?board=${slug}`}>
                새 스레드 작성
              </Link>
            ) : (
              <Link className="submit-btn primary" href="/write">
                새 스레드 작성
              </Link>
            )}
          </div>

          <div className="thread-list">
            {data.items.length ? (
              data.items.map((thread) => <ThreadCard key={thread.id} thread={thread} />)
            ) : (
              <div className="thread-card">
                <div className="thread-num">#00</div>
                <div>
                  <div className="thread-title">아직 게시물이 없습니다.</div>
                  <div className="thread-preview">첫 스레드를 작성해서 게시판을 시작해 보세요.</div>
                </div>
                <div className="thread-thumb-col">
                  <div className="thumb-placeholder">[]</div>
                </div>
              </div>
            )}
          </div>

          {data.pagination.totalPages > 1 ? (
            <nav className="pagination" aria-label="게시판 페이지 이동">
              <Link
                className={`toolbar-button ${page <= 1 ? 'disabled' : ''}`}
                href={buildBoardHref(slug, sort, Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                tabIndex={page <= 1 ? -1 : undefined}
              >
                이전
              </Link>
              <div className="pagination-status">
                {page} / {data.pagination.totalPages} 페이지
              </div>
              <Link
                className={`toolbar-button ${page >= data.pagination.totalPages ? 'disabled' : ''}`}
                href={buildBoardHref(slug, sort, Math.min(data.pagination.totalPages, page + 1))}
                aria-disabled={page >= data.pagination.totalPages}
                tabIndex={page >= data.pagination.totalPages ? -1 : undefined}
              >
                다음
              </Link>
            </nav>
          ) : null}
        </main>

        <aside className="sidebar">
          <div className="sidebar-widget">
            <h3>// 현재 스레드</h3>
            <ul className="plain-list">
              {data.items.slice(0, 4).map((thread) => (
                <li key={thread.id}>
                  <Link className="plain-link" href={`/threads/${thread.id}`}>
                    {thread.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="sidebar-widget">
            <h3>// 게시판 이동</h3>
            <ul className="board-quick-list">
              {sidebarBoards.map((board) => (
                <li key={board.slug}>
                  <Link href={`/boards/${board.slug}`}>
                    <span className="tag">/{board.slug}/</span>
                    {getBoardDisplayMeta(board).name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    );
  } catch {
    notFound();
  }
}
