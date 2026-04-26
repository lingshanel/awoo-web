import Link from 'next/link';
import { ThreadCard } from '@/components/thread-card';
import { getRecentThreads } from '@/lib/api';

type SearchPageProps = {
  searchParams: Promise<{ q?: string; page?: string; media?: 'all' | 'images' }>;
};

function buildSearchHref(q: string, page: number, media: 'all' | 'images') {
  const params = new URLSearchParams();

  if (q) {
    params.set('q', q);
  }

  if (media !== 'all') {
    params.set('media', media);
  }

  params.set('page', String(page));

  return `/search?${params.toString()}`;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const q = (resolvedSearchParams.q ?? '').trim();
  const page = Math.max(1, Number(resolvedSearchParams.page ?? '1') || 1);
  const media = resolvedSearchParams.media === 'images' ? 'images' : 'all';
  const data = q || media === 'images'
    ? await getRecentThreads('latest', 20, page, { q, media })
    : { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };

  return (
    <div className="page-body">
      <main className="main-column">
        <section className="board-header">
          <div>
            <div className="board-tag">/search/</div>
            <div className="board-name">
              // 검색
              {media === 'images' ? ' · 이미지가 있는 스레드만 보기' : ' · 전체 스레드 검색'}
            </div>
          </div>
          <div className="board-stats">
            <div className="board-stat">
              <span className="val">{data.pagination.total}</span>
              <span>결과</span>
            </div>
            <div className="board-stat">
              <span className="val">{media === 'images' ? 'IMG' : 'ALL'}</span>
              <span>범위</span>
            </div>
          </div>
        </section>

        <form className="search-bar" action="/search">
          <input
            aria-label="스레드 검색어"
            defaultValue={q}
            name="q"
            placeholder="제목이나 본문으로 스레드 검색"
          />
          {media === 'images' ? <input name="media" type="hidden" value="images" /> : null}
          <button type="submit">검색</button>
        </form>

        <div className="toolbar">
          <div className="toolbar-group">
            <Link
              className={`toolbar-button ${media === 'all' ? 'active' : ''}`}
              href={buildSearchHref(q, 1, 'all')}
            >
              전체
            </Link>
            <Link
              className={`toolbar-button ${media === 'images' ? 'active' : ''}`}
              href={buildSearchHref(q, 1, 'images')}
            >
              이미지
            </Link>
          </div>
        </div>

        <div className="thread-list">
          {data.items.length ? (
            data.items.map((thread) => <ThreadCard key={thread.id} thread={thread} />)
          ) : (
            <div className="thread-card">
              <div className="thread-num">#00</div>
              <div>
                <div className="thread-title">
                  {q || media === 'images' ? '검색 결과가 없습니다.' : '검색어를 입력해 주세요.'}
                </div>
                <div className="thread-preview">
                  제목과 본문을 기준으로 전체 스레드를 검색합니다.
                </div>
              </div>
              <div className="thread-thumb-col">
                <div className="thumb-placeholder">[]</div>
              </div>
            </div>
          )}
        </div>

        {data.pagination.totalPages > 1 ? (
          <nav className="pagination" aria-label="검색 결과 페이지 이동">
            <Link
              className={`toolbar-button ${page <= 1 ? 'disabled' : ''}`}
              href={buildSearchHref(q, Math.max(1, page - 1), media)}
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
              href={buildSearchHref(q, Math.min(data.pagination.totalPages, page + 1), media)}
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
          <h3>// 빠른 이동</h3>
          <ul className="plain-list">
            <li>
              <Link className="plain-link" href="/boards/all?sort=latest">최근 스레드</Link>
            </li>
            <li>
              <Link className="plain-link" href="/boards/all?sort=popular">HOT 스레드</Link>
            </li>
            <li>
              <Link className="plain-link" href="/search?media=images">이미지 스레드</Link>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
