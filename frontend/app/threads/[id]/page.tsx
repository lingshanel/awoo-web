import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LightboxGallery } from '@/components/lightbox-gallery';
import { PostRichText, type RichTextReference } from '@/components/post-rich-text';
import { ReactionControls } from '@/components/reaction-controls';
import { ReplyForm } from '@/components/reply-form';
import { ThreadViewTracker } from '@/components/thread-view-tracker';
import { getThread } from '@/lib/api';

type ThreadPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ replyTo?: string; sort?: 'oldest' | 'latest' | 'likes' }>;
};

type ThreadDetail = Awaited<ReturnType<typeof getThread>>;
type PostSort = 'oldest' | 'latest' | 'likes';
type DisplayPost = ThreadDetail['posts'][number] & {
  displayNumber: number;
  displayAuthorName: string;
};

const POST_SORT_OPTIONS = [
  { value: 'oldest', label: '등록순' },
  { value: 'latest', label: '최신순' },
  { value: 'likes', label: '추천순' },
] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function isAnonymousName(name: string) {
  return name === '익명' || /^익명\d+$/.test(name);
}

function getParticipantKey(
  authorName: string,
  participantKey: string | null | undefined,
  authorHash: string | null | undefined,
  fallbackKey: string,
) {
  if (!isAnonymousName(authorName)) {
    return `named:${authorHash ?? fallbackKey}`;
  }

  return `anon:${participantKey ?? authorHash ?? fallbackKey}`;
}

function getAnonymousLabelMap(thread: ThreadDetail) {
  const labelMap = new Map<string, string>();
  let anonymousIndex = 1;

  const threadParticipantKey = getParticipantKey(
    thread.authorName,
    thread.participantKey,
    thread.authorHash,
    `thread-${thread.id}`,
  );

  if (isAnonymousName(thread.authorName)) {
    labelMap.set(threadParticipantKey, `익명${anonymousIndex}`);
    anonymousIndex += 1;
  }

  const postAuthorNames = new Map<number, string>();
  const chronologicalPosts = [...thread.posts].sort((left, right) => {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });

  for (const post of chronologicalPosts) {
    const participantKey = getParticipantKey(
      post.authorName,
      post.participantKey,
      post.authorHash,
      `post-${post.id}`,
    );

    if (!isAnonymousName(post.authorName)) {
      postAuthorNames.set(post.id, post.authorName);
      continue;
    }

    if (!labelMap.has(participantKey)) {
      labelMap.set(participantKey, `익명${anonymousIndex}`);
      anonymousIndex += 1;
    }

    postAuthorNames.set(post.id, labelMap.get(participantKey)!);
  }

  const threadAuthorName = isAnonymousName(thread.authorName)
    ? (labelMap.get(threadParticipantKey) ?? '익명1')
    : thread.authorName;

  return { threadAuthorName, postAuthorNames };
}

function buildDisplayPosts(thread: ThreadDetail, postAuthorNames: Map<number, string>) {
  const chronologicalPosts = [...thread.posts].sort((left, right) => {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });

  return chronologicalPosts.map((post, index) => ({
    ...post,
    displayNumber: index + 1,
    displayAuthorName: postAuthorNames.get(post.id) ?? post.authorName,
  }));
}

function buildPostReferences(posts: DisplayPost[]) {
  return Object.fromEntries(
    posts.map((post) => [
      post.id,
      {
        id: post.id,
        displayNumber: post.displayNumber,
        authorName: post.displayAuthorName,
        content: post.content,
        createdAt: post.createdAt,
        attachments: post.attachments,
      } satisfies RichTextReference,
    ]),
  ) as Record<number, RichTextReference>;
}

function sortDisplayPosts(posts: DisplayPost[], sort: PostSort) {
  return [...posts].sort((left, right) => {
    if (sort === 'latest') {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    if (sort === 'likes') {
      return (
        right.likeCount - left.likeCount ||
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      );
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

function buildPostTree(posts: DisplayPost[]) {
  const childrenByParent = new Map<number, DisplayPost[]>();
  const topLevelPosts: DisplayPost[] = [];

  for (const post of posts) {
    if (post.parentPostId) {
      const siblings = childrenByParent.get(post.parentPostId) ?? [];
      siblings.push(post);
      childrenByParent.set(post.parentPostId, siblings);
      continue;
    }

    topLevelPosts.push(post);
  }

  return { topLevelPosts, childrenByParent };
}

function PostCard({
  post,
  threadId,
  threadAuthorHash,
  postNumberById,
  postAuthorNames,
  postReferences,
  childrenByParent,
  depth = 0,
}: {
  post: DisplayPost;
  threadId: number;
  threadAuthorHash?: string | null;
  postNumberById: Map<number, number>;
  postAuthorNames: Map<number, string>;
  postReferences: Record<number, RichTextReference>;
  childrenByParent?: Map<number, DisplayPost[]>;
  depth?: number;
}) {
  const children = childrenByParent?.get(post.id) ?? [];
  const replyTargetNumber = post.replyTo ? postNumberById.get(post.replyTo.id) : undefined;
  const replyTargetAuthorName = post.replyTo
    ? postAuthorNames.get(post.replyTo.id) ?? post.replyTo.authorName
    : null;

  return (
    <article
      id={`post-${post.id}`}
      key={post.id}
      className={`reply-item ${post.authorHash === threadAuthorHash ? 'op' : ''} ${
        depth > 0 ? 'reply-child' : ''
      }`}
      style={depth > 0 ? { marginLeft: Math.min(depth, 4) * 24 } : undefined}
    >
      <div className="reply-meta">
        <span>#{post.displayNumber}</span>
        <span>{post.displayAuthorName}</span>
        <span>ID: {post.authorHash ?? 'anon'}</span>
        <span>{formatDate(post.createdAt)}</span>
        <span>추천 {post.likeCount}</span>
        {post.replyTo ? (
          <span>
            → #{replyTargetNumber ?? post.replyTo.id} {replyTargetAuthorName} 님에게 답글
          </span>
        ) : null}
      </div>
      <div className="reply-body">
        <PostRichText content={post.content} references={postReferences} />
      </div>
      {post.attachments.length ? (
        <div style={{ marginTop: 10 }}>
          <LightboxGallery attachments={post.attachments} />
        </div>
      ) : null}
      <div className="reply-actions">
        <Link className="reaction-btn" href={`/threads/${threadId}?replyTo=${post.id}#reply-form`}>
          답글
        </Link>
        <ReactionControls id={post.id} target="post" />
      </div>
      {childrenByParent
        ? children.map((child) => (
            <PostCard
              key={child.id}
              post={child}
              threadId={threadId}
              threadAuthorHash={threadAuthorHash}
              postNumberById={postNumberById}
              postAuthorNames={postAuthorNames}
              postReferences={postReferences}
              childrenByParent={childrenByParent}
              depth={depth + 1}
            />
          ))
        : null}
    </article>
  );
}

export default async function ThreadPage({ params, searchParams }: ThreadPageProps) {
  const { id } = await params;
  const threadId = Number(id);
  const resolvedSearchParams = await searchParams;
  const { replyTo } = resolvedSearchParams;
  const postSort: PostSort = POST_SORT_OPTIONS.some(
    (option) => option.value === resolvedSearchParams.sort,
  )
    ? (resolvedSearchParams.sort as PostSort)
    : 'oldest';

  if (Number.isNaN(threadId)) {
    notFound();
  }

  try {
    const thread = await getThread(threadId);
    const { threadAuthorName, postAuthorNames } = getAnonymousLabelMap(thread);
    const displayPosts = buildDisplayPosts(thread, postAuthorNames);
    const postReferences = buildPostReferences(displayPosts);
    const postNumberById = new Map(displayPosts.map((post) => [post.id, post.displayNumber]));
    const replyTarget =
      replyTo ? displayPosts.find((post) => post.id === Number(replyTo)) ?? null : null;
    const sortedPosts = sortDisplayPosts(displayPosts, postSort);
    const { topLevelPosts, childrenByParent } = buildPostTree(displayPosts);

    return (
      <div className="page-body">
        <ThreadViewTracker threadId={thread.id} />
        <main className="main-column">
          <div className="news-ticker" style={{ marginBottom: 14 }}>
            <span className="label">[PATH]</span>
            <Link href="/">AWOO/KR</Link> /{' '}
            <Link href={`/boards/${thread.board.slug}`}>/{thread.board.slug}/</Link> / #{thread.id}
          </div>

          <article className="post-shell">
            <div className="post-header">
              <div className="post-meta">
                <span>#{thread.id}</span>
                <span>{threadAuthorName}</span>
                <span>ID: {thread.authorHash ?? 'anon'}</span>
                <span>{formatDate(thread.createdAt)}</span>
              </div>
              <div className="post-meta">
                <span>댓글 {thread.replyCount}</span>
                <span>조회 {thread.viewCount}</span>
                <span>추천 {thread.likeCount}</span>
              </div>
            </div>
            <div className="post-title">{thread.title}</div>
            <div className="post-content">
              <PostRichText content={thread.content} references={postReferences} />
            </div>
            {thread.attachments.length ? (
              <div className="post-content" style={{ paddingTop: 0 }}>
                <LightboxGallery attachments={thread.attachments} />
              </div>
            ) : null}
            <div className="post-actions">
              <div className="reaction-bar">
                <div className="reaction-btn">THREAD</div>
                {thread.hasSpoiler ? <div className="reaction-btn">SPOILER</div> : null}
                {thread.hasNsfw ? <div className="reaction-btn">성인 주의</div> : null}
              </div>
              <ReactionControls id={thread.id} target="thread" />
            </div>
          </article>

          <section className="reply-box" style={{ marginTop: 20 }}>
            <div className="reply-section-title">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span>// replies {thread.posts.length}</span>
                <div className="sort-tabs">
                  {POST_SORT_OPTIONS.map((option) => (
                    <Link
                      key={option.value}
                      className={`toolbar-button ${postSort === option.value ? 'active' : ''}`}
                      href={`/threads/${thread.id}?sort=${option.value}${replyTo ? `&replyTo=${replyTo}` : ''}`}
                      scroll={false}
                    >
                      {option.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            {displayPosts.length ? (
              postSort === 'oldest' ? (
                topLevelPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    threadId={thread.id}
                    threadAuthorHash={thread.authorHash}
                    postNumberById={postNumberById}
                    postAuthorNames={postAuthorNames}
                    postReferences={postReferences}
                    childrenByParent={childrenByParent}
                  />
                ))
              ) : (
                sortedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    threadId={thread.id}
                    threadAuthorHash={thread.authorHash}
                    postNumberById={postNumberById}
                    postAuthorNames={postAuthorNames}
                    postReferences={postReferences}
                  />
                ))
              )
            ) : (
              <div className="reply-item">
                <div className="reply-body">아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.</div>
              </div>
            )}
          </section>

          <div style={{ marginTop: 20 }}>
            <ReplyForm
              replyTo={
                replyTarget
                  ? { id: replyTarget.id, authorName: replyTarget.displayAuthorName }
                  : null
              }
              threadId={thread.id}
            />
          </div>
        </main>

        <aside className="sidebar">
          <div className="sidebar-widget">
            <h3>// Thread Info</h3>
            <div className="stat-row">
              <span>번호</span>
              <span className="val">#{thread.id}</span>
            </div>
            <div className="stat-row">
              <span>게시판</span>
              <span className="val">/{thread.board.slug}/</span>
            </div>
            <div className="stat-row">
              <span>댓글 수</span>
              <span className="val">{thread.replyCount}</span>
            </div>
            <div className="stat-row">
              <span>조회 수</span>
              <span className="val">{thread.viewCount}</span>
            </div>
          </div>
          <div className="sidebar-widget">
            <h3>// Move</h3>
            <ul className="plain-list">
              <li>
                <Link className="plain-link" href={`/boards/${thread.board.slug}`}>
                  /{thread.board.slug}/ 목록으로
                </Link>
              </li>
              <li>
                <Link className="plain-link" href="/write">
                  새 스레드 작성
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    );
  } catch {
    notFound();
  }
}
