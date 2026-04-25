import Link from 'next/link';
import type { ThreadListItem } from '@/lib/api';
import { isHotThread } from '@/lib/thread-heat';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatActivityLabel(thread: ThreadListItem) {
  return `최근 활동 ${formatDate(thread.bumpedAt || thread.createdAt)}`;
}

export function ThreadCard({
  thread,
  featured = false,
  compact = false,
}: {
  thread: ThreadListItem;
  featured?: boolean;
  compact?: boolean;
}) {
  const thumb = thread.attachments[0];
  const hot = isHotThread(thread);

  if (compact) {
    return (
      <Link className="thread-card thread-card-compact" href={`/threads/${thread.id}`}>
        <div className="thread-board-tag">/{thread.board.slug}/</div>
        <div className="thread-card-main">
          <div className="thread-title compact-title">
            {thread.title}
            {hot ? <span className="thread-inline-hot"> HOT</span> : null}
          </div>
        </div>
        <div className={`thread-compact-side ${thumb ? 'has-thumb' : 'no-thumb'}`}>
          {thumb ? (
            <div className="thread-compact-thumb-col">
              <img
                alt={thumb.originalName}
                className="thread-thumb thread-thumb-compact"
                src={thumb.thumbnailUrl || thumb.url}
              />
            </div>
          ) : (
            <div className="thread-compact-thumb-spacer" />
          )}
          <div className="thread-meta">
            <span className="thread-replies">댓글 {thread.replyCount}</span>
            <span>{formatActivityLabel(thread)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link className={`thread-card ${featured ? 'featured' : ''}`} href={`/threads/${thread.id}`}>
      <div className="thread-num">#{thread.id}</div>
      <div className="thread-content-col">
        <div className="thread-title-row">
          <div className="thread-badges">
            <span className="thread-badge badge-board">/{thread.board.slug}/</span>
            {hot ? <span className="thread-badge badge-hot">HOT</span> : null}
            {thumb ? <span className="thread-badge badge-img">IMG</span> : null}
            {thread.replyCount === 0 ? <span className="thread-badge badge-new">NEW</span> : null}
          </div>
          <span className="thread-title">{thread.title}</span>
        </div>
        <div className="thread-preview">{thread.contentPreview}</div>
        <div className="thread-meta-row">
          <span className="thread-meta-item">{formatActivityLabel(thread)}</span>
          <span className="thread-meta-item replies">댓글 {thread.replyCount}</span>
          <span className="thread-meta-item">조회 {thread.viewCount}</span>
          <span className="thread-meta-item">추천 {thread.likeCount}</span>
          <span className="thread-meta-item">{thread.authorName}</span>
        </div>
      </div>
      <div className="thread-thumb-col">
        {thumb ? (
          <div className="thread-thumb-frame">
            <img
              alt={thumb.originalName}
              className="thread-thumb"
              src={thumb.thumbnailUrl || thumb.url}
            />
          </div>
        ) : (
          <div className="thumb-placeholder">[]</div>
        )}
      </div>
    </Link>
  );
}
