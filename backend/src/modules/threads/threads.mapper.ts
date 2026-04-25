import { Thread } from '@prisma/client';

type ThreadWithRelations = Thread & {
  board: {
    id: number;
    slug: string;
    name: string;
  };
  attachments: Array<{
    id: number;
    storageKey: string;
    thumbnailKey: string | null;
    originalName: string;
    mimeType: string;
    size: number;
    width: number | null;
    height: number | null;
  }>;
  posts?: Array<{
    id: number;
    parentPostId: number | null;
    content: string;
    authorName: string | null;
    authorHash: string | null;
    authorIpHash: string | null;
    likeCount: number;
    createdAt: Date;
    parentPost: {
      id: number;
      authorName: string | null;
      authorHash: string | null;
    } | null;
    attachments: Array<{
      id: number;
      storageKey: string;
      thumbnailKey: string | null;
      originalName: string;
      mimeType: string;
      size: number;
      width: number | null;
      height: number | null;
    }>;
  }>;
};

export function toAttachmentResponse(
  attachment: ThreadWithRelations['attachments'][number],
) {
  return {
    id: attachment.id,
    url: attachment.storageKey,
    thumbnailUrl: attachment.thumbnailKey,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    size: attachment.size,
    width: attachment.width,
    height: attachment.height,
  };
}

export function toThreadListItem(thread: ThreadWithRelations) {
  return {
    id: thread.id,
    board: {
      slug: thread.board.slug,
      name: thread.board.name,
    },
    title: thread.title,
    contentPreview: thread.content.slice(0, 160),
    authorName: thread.authorName ?? '익명',
    authorHash: thread.authorHash,
    participantKey: thread.authorIpHash,
    replyCount: thread.replyCount,
    viewCount: thread.viewCount,
    likeCount: thread.likeCount,
    hasSpoiler: thread.hasSpoiler,
    hasNsfw: thread.hasNsfw,
    isPinned: thread.isPinned,
    bumpedAt: thread.bumpedAt,
    createdAt: thread.createdAt,
    attachments: thread.attachments.map(toAttachmentResponse),
  };
}

export function toThreadDetail(thread: ThreadWithRelations) {
  return {
    ...toThreadListItem(thread),
    content: thread.content,
    posts:
      thread.posts?.map((post) => ({
        id: post.id,
        parentPostId: post.parentPostId,
        replyTo: post.parentPost
          ? {
              id: post.parentPost.id,
              authorName: post.parentPost.authorName ?? '익명',
              authorHash: post.parentPost.authorHash,
            }
          : null,
        content: post.content,
        authorName: post.authorName ?? '익명',
        authorHash: post.authorHash,
        participantKey: post.authorIpHash,
        likeCount: post.likeCount,
        createdAt: post.createdAt,
        attachments: post.attachments.map(toAttachmentResponse),
      })) ?? [],
  };
}
