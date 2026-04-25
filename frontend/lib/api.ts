const SERVER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';
const CLIENT_API_BASE_URL = '/api';

function getApiBaseUrl() {
  return typeof window === 'undefined' ? SERVER_API_BASE_URL : CLIENT_API_BASE_URL;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export type Attachment = {
  id: number;
  url: string;
  thumbnailUrl?: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
};

export type BoardSummary = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  threadCount: number;
  isActive?: boolean;
  sortOrder?: number;
};

export type ThreadListItem = {
  id: number;
  board: {
    slug: string;
    name: string;
  };
  title: string;
  contentPreview: string;
  authorName: string;
  authorHash?: string | null;
  participantKey?: string | null;
  replyCount: number;
  viewCount: number;
  likeCount: number;
  hasSpoiler: boolean;
  hasNsfw: boolean;
  isPinned: boolean;
  bumpedAt: string;
  createdAt: string;
  attachments: Attachment[];
};

export type PostItem = {
  id: number;
  parentPostId: number | null;
  replyTo?: {
    id: number;
    authorName: string;
    authorHash?: string | null;
  } | null;
  content: string;
  authorName: string;
  authorHash?: string | null;
  participantKey?: string | null;
  likeCount: number;
  createdAt: string;
  attachments: Attachment[];
};

export type ThreadDetail = ThreadListItem & {
  content: string;
  posts: PostItem[];
};

export type ReportItem = {
  id: number;
  targetType: 'THREAD' | 'POST';
  targetId: number;
  threadId?: number | null;
  postId?: number | null;
  reason: string;
  status: string;
  createdAt: string;
};

export async function getBoards() {
  const response = await fetch(`${getApiBaseUrl()}/boards`, {
    cache: 'no-store',
  });
  return handleResponse<{ items: BoardSummary[]; total: number }>(response);
}

export async function getBoardThreads(
  slug: string,
  sort: 'latest' | 'popular' | 'views' = 'latest',
  page = 1,
) {
  const response = await fetch(
    `${getApiBaseUrl()}/boards/${slug}/threads?sort=${sort}&page=${page}`,
    {
      cache: 'no-store',
    },
  );
  return handleResponse<{
    board: BoardSummary;
    items: ThreadListItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(response);
}

export async function getRecentThreads(
  sort: 'latest' | 'popular' | 'views' = 'latest',
  limit = 8,
  page = 1,
) {
  const response = await fetch(
    `${getApiBaseUrl()}/boards/recent/threads?sort=${sort}&limit=${limit}&page=${page}`,
    {
      cache: 'no-store',
    },
  );

  return handleResponse<{
    items: ThreadListItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(response);
}

export async function getThread(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/threads/${id}`, {
    cache: 'no-store',
  });
  return handleResponse<ThreadDetail>(response);
}

export async function registerThreadView(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/threads/${id}/view`, {
    method: 'POST',
  });

  return handleResponse<{ id: number; message: string }>(response);
}

export async function createThread(payload: {
  boardSlug: string;
  title: string;
  content: string;
  authorName?: string;
  email?: string;
  isSage?: boolean;
  hasSpoiler?: boolean;
  hasNsfw?: boolean;
  attachmentIds?: number[];
  captchaToken: string;
  captchaAnswer: string;
}) {
  const response = await fetch(`${getApiBaseUrl()}/threads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<{ item: ThreadDetail }>(response);
}

export async function createPost(
  threadId: number,
  payload: {
    content: string;
    authorName?: string;
    email?: string;
    parentPostId?: number;
    isSage?: boolean;
    attachmentIds?: number[];
  },
) {
  const response = await fetch(`${getApiBaseUrl()}/threads/${threadId}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<{ item: { id: number } }>(response);
}

export async function uploadImages(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await fetch(`${getApiBaseUrl()}/uploads/images`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse<{ items: Attachment[]; total: number }>(response);
}

export async function deleteUpload(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/uploads/${id}`, {
    method: 'DELETE',
  });

  return handleResponse<{ id: number; message: string }>(response);
}

export async function reactToTarget(
  target: 'thread' | 'post',
  id: number,
  reactionType: 'like' | 'dislike' = 'like',
) {
  const response = await fetch(`${getApiBaseUrl()}/${target}s/${id}/reactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reactionType }),
  });

  return handleResponse<{ message?: string }>(response);
}

export async function reportTarget(
  target: 'thread' | 'post',
  id: number,
  reason: string,
) {
  const response = await fetch(`${getApiBaseUrl()}/${target}s/${id}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetType: target,
      reason,
    }),
  });

  return handleResponse<{ id: number; status: string }>(response);
}

export async function getAdminReports(adminKey: string) {
  const response = await fetch(`${getApiBaseUrl()}/admin/reports`, {
    cache: 'no-store',
    headers: {
      'x-admin-key': adminKey,
    },
  });

  return handleResponse<{ items: ReportItem[]; total: number }>(response);
}

export async function adminHideTarget(
  target: 'thread' | 'post',
  id: number,
  adminKey: string,
  reason?: string,
) {
  const response = await fetch(`${getApiBaseUrl()}/admin/${target}s/${id}/hide`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ reason }),
  });

  return handleResponse<{ message: string }>(response);
}

export async function adminResolveReport(
  id: number,
  adminKey: string,
  hideTarget: boolean,
) {
  const response = await fetch(`${getApiBaseUrl()}/admin/reports/${id}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ hideTarget }),
  });

  return handleResponse<{ id: number; status: string }>(response);
}
