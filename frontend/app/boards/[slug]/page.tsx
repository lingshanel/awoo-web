import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ThreadListWithViewMode } from '@/components/thread-list-with-view-mode';
import { getBoardThreads, getBoards, getRecentThreads, type BoardSummary } from '@/lib/api';
import { getBoardAccent, getBoardDisplayMeta } from '@/lib/board-meta';

type BoardPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: 'latest' | 'popular' | 'views'; page?: string }>;
};

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'views', label: '조회순' },
] as const;

const THREADS_PER_PAGE = 10;

const ALL_BOARD: BoardSummary = {
  id: 0,
  slug: 'all',
  name: '전체',
  description: '모든 카테고리의 스레드 모아보기',
  threadCount: 0,
};

function buildBoardHref(slug: string, sort: string, page: number) {
  return `/boards/${slug}?sort=${sort}&page=${page}`;
}

function getPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 10) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages]);
  const start = Math.max(2, currentPage - 3);
  const end = Math.min(totalPages - 1, currentPage + 3);

  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
    pages.add(pageNumber);
  }

  const orderedPages = [...pages].sort((a, b) => a - b);
  const items: Array<number | 'ellipsis'> = [];

  orderedPages.forEach((pageNumber, index) => {
    const previousPage = orderedPages[index - 1];

    if (previousPage && pageNumber - previousPage > 1) {
      items.push('ellipsis');
    }

    items.push(pageNumber);
  });

  return items;
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
        ? await getRecentThreads(sort, THREADS_PER_PAGE, page).then((result) => ({
            board: { ...ALL_BOARD, threadCount: result.pagination.total },
            items: result.items,
            pagination: result.pagination,
          }))
        : await getBoardThreads(slug, sort, page, THREADS_PER_PAGE);

    if (page > data.pagination.totalPages) {
      redirect(buildBoardHref(slug, sort, data.pagination.totalPages));
    }

    const boardMeta = getBoardDisplayMeta(data.board);

    return (
      <div
        className="page-body"
        style={{
          ['--board-accent' as string]: getBoardAccent(data.board.slug),
        }}
      >
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
                <span>스레드</span>
              </div>
              <div className="board-stat">
                <span className="val">{data.pagination.total}</span>
                <span>표시 중</span>
              </div>
              <div className="board-stat">
                <span className="val">
                  {sort === 'latest' ? 'NEW' : sort === 'popular' ? 'HOT' : 'VIEW'}
                </span>
                <span>정렬</span>
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

          {data.items.length ? (
            <ThreadListWithViewMode threads={data.items} />
          ) : (
            <div className="thread-list">
              <div className="thread-card">
                <div className="thread-num">#00</div>
                <div>
                  <div className="thread-title">아직 스레드가 없습니다.</div>
                  <div className="thread-preview">첫 스레드를 작성해서 카테고리를 시작해 보세요.</div>
                </div>
                <div className="thread-thumb-col">
                  <div className="thumb-placeholder">[]</div>
                </div>
              </div>
            </div>
          )}

          {data.pagination.totalPages > 1 ? (
            <nav className="pagination" aria-label="스레드 페이지 이동">
              <div className="pagination-controls">
                <Link
                  className={`pagination-arrow ${page <= 1 ? 'disabled' : ''}`}
                  href={buildBoardHref(slug, sort, Math.max(1, page - 1))}
                  aria-label="이전 페이지"
                  aria-disabled={page <= 1}
                  tabIndex={page <= 1 ? -1 : undefined}
                >
                  &lt;
                </Link>
                <div className="pagination-pages">
                  {getPageItems(page, data.pagination.totalPages).map((pageItem, index) =>
                    pageItem === 'ellipsis' ? (
                      <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                        ...
                      </span>
                    ) : (
                  <Link
                    key={pageItem}
                    className={`pagination-page ${pageItem === page ? 'active' : ''}`}
                    href={buildBoardHref(slug, sort, pageItem)}
                    aria-current={pageItem === page ? 'page' : undefined}
                  >
                    {pageItem}
                  </Link>
                    ),
                  )}
                </div>
                <Link
                  className={`pagination-arrow ${page >= data.pagination.totalPages ? 'disabled' : ''}`}
                  href={buildBoardHref(slug, sort, Math.min(data.pagination.totalPages, page + 1))}
                  aria-label="다음 페이지"
                  aria-disabled={page >= data.pagination.totalPages}
                  tabIndex={page >= data.pagination.totalPages ? -1 : undefined}
                >
                  &gt;
                </Link>
              </div>
              <div className="pagination-status">
                {page} / {data.pagination.totalPages} 페이지
              </div>
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
            <h3>// 카테고리 이동</h3>
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
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'digest' in error &&
      String(error.digest).startsWith('NEXT_REDIRECT')
    ) {
      throw error;
    }

    notFound();
  }
}
