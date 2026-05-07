const SERVER_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';
const CLIENT_API_BASE_URL = '/api';

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

const BOARD_CACHE_SECONDS = 300;
const THREAD_LIST_CACHE_SECONDS = 10;
const THREAD_DETAIL_CACHE_SECONDS = 5;

function getApiBaseUrl() {
  return typeof window === 'undefined' ? SERVER_API_BASE_URL : CLIENT_API_BASE_URL;
}

function getPublicReadOptions(revalidateSeconds: number): NextFetchInit {
  return typeof window === 'undefined'
    ? { next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' };
}

function getCookieValue(name: string) {
  if (typeof document === 'undefined') {
    return undefined;
  }

  return document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function getAdminHeaders() {
  const csrfToken = getCookieValue('awoo_admin_csrf');

  return {
    'Content-Type': 'application/json',
    ...(csrfToken ? { 'x-csrf-token': decodeURIComponent(csrfToken) } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(getErrorMessage(text, response.status));
  }

  return (await response.json()) as T;
}

function getErrorMessage(text: string, status: number) {
  if (text) {
    try {
      const parsed = JSON.parse(text) as { message?: unknown };
      const message = parsed.message;

      if (Array.isArray(message)) {
        return message.join('\n');
      }

      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    } catch {
      if (!text.trim().startsWith('{')) {
        return text;
      }
    }
  }

  if (status === 400) {
    return '입력값을 다시 확인해 주세요.';
  }

  if (status === 403) {
    return '권한이 없거나 비밀번호가 올바르지 않습니다.';
  }

  if (status === 404) {
    return '요청한 내용을 찾을 수 없습니다.';
  }

  if (status >= 500) {
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }

  return '요청을 처리하지 못했습니다.';
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
  deleteToken?: string;
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
    isDeleted?: boolean;
  } | null;
  content: string;
  authorName: string;
  authorHash?: string | null;
  participantKey?: string | null;
  likeCount: number;
  isDeleted: boolean;
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
  resolvedAt?: string | null;
  thread?: {
    id: number;
    title: string;
    content: string;
    authorHash?: string | null;
    authorIpHash?: string | null;
    isDeleted: boolean;
    createdAt: string;
    board: {
      slug: string;
      name: string;
    };
  } | null;
  post?: {
    id: number;
    content: string;
    threadId: number;
    authorHash?: string | null;
    authorIpHash?: string | null;
    isDeleted: boolean;
    createdAt: string;
    thread: {
      id: number;
      title: string;
      board: {
        slug: string;
        name: string;
      };
    };
  } | null;
};

export type AdminSummary = {
  pendingReports: number;
  resolvedReports: number;
  activeThreads: number;
  hiddenThreads: number;
  activePosts: number;
  hiddenPosts: number;
  todayThreads: number;
  todayPosts: number;
  todayReports: number;
  activeBans: number;
};

export type AdminUser = {
  id: number;
  username: string;
  role: string;
};

export type AdminActionLogItem = {
  id: number;
  actionType: string;
  targetType?: string | null;
  targetId?: number | null;
  reason?: string | null;
  createdAt: string;
  user?: {
    username: string;
    role: string;
  } | null;
};

export type AdminBanItem = {
  id: number;
  banType: 'AUTHOR_HASH' | 'IP_HASH';
  valueHash: string;
  reason: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  createdBy?: {
    username: string;
  } | null;
};

export async function getBoards() {
  const response = await fetch(
    `${getApiBaseUrl()}/boards`,
    getPublicReadOptions(BOARD_CACHE_SECONDS),
  );
  return handleResponse<{ items: BoardSummary[]; total: number }>(response);
}

export async function getBoardThreads(
  slug: string,
  sort: 'latest' | 'popular' | 'views' = 'latest',
  page = 1,
  limit = 10,
) {
  const response = await fetch(
    `${getApiBaseUrl()}/boards/${slug}/threads?sort=${sort}&page=${page}&limit=${limit}`,
    getPublicReadOptions(THREAD_LIST_CACHE_SECONDS),
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
  options: { q?: string; media?: 'all' | 'images' } = {},
) {
  const params = new URLSearchParams({
    sort,
    limit: String(limit),
    page: String(page),
  });

  if (options.q) {
    params.set('q', options.q);
  }

  if (options.media && options.media !== 'all') {
    params.set('media', options.media);
  }

  const response = await fetch(
    `${getApiBaseUrl()}/boards/recent/threads?${params.toString()}`,
    getPublicReadOptions(THREAD_LIST_CACHE_SECONDS),
  );

  return handleResponse<{
    items: ThreadListItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(response);
}

export async function getThread(id: number) {
  const response = await fetch(
    `${getApiBaseUrl()}/threads/${id}`,
    getPublicReadOptions(THREAD_DETAIL_CACHE_SECONDS),
  );
  return handleResponse<ThreadDetail>(response);
}

export async function getCaptchaChallenge() {
  const response = await fetch(`${getApiBaseUrl()}/security/captcha`, {
    cache: 'no-store',
  });

  return handleResponse<{ code: string; token: string; expiresAt: string }>(response);
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
  attachmentDeleteTokens?: string[];
  editPassword: string;
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
    editPassword: string;
    isSage?: boolean;
    attachmentIds?: number[];
    attachmentDeleteTokens?: string[];
    captchaToken: string;
    captchaAnswer: string;
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

async function requestWithJsonBody<T>(url: string, method: string, payload: unknown) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<T>(response);
}

export async function updateThread(
  id: number,
  payload: { title: string; content: string; editPassword: string; captchaToken: string; captchaAnswer: string },
) {
  return requestWithJsonBody<{ item: ThreadDetail; message: string }>(
    `${getApiBaseUrl()}/threads/${id}`,
    'PATCH',
    payload,
  );
}

export async function deleteThread(id: number, editPassword: string) {
  return requestWithJsonBody<{ id: number; message: string }>(
    `${getApiBaseUrl()}/threads/${id}`,
    'DELETE',
    { editPassword },
  );
}

export async function updatePost(
  threadId: number,
  postId: number,
  payload: { content: string; editPassword: string; captchaToken: string; captchaAnswer: string },
) {
  return requestWithJsonBody<{ item: { id: number }; message: string }>(
    `${getApiBaseUrl()}/threads/${threadId}/posts/${postId}`,
    'PATCH',
    payload,
  );
}

export async function deletePost(threadId: number, postId: number, editPassword: string) {
  return requestWithJsonBody<{ id: number; message: string }>(
    `${getApiBaseUrl()}/threads/${threadId}/posts/${postId}`,
    'DELETE',
    { editPassword },
  );
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

export async function deleteUpload(id: number, deleteToken?: string) {
  const response = await fetch(`${getApiBaseUrl()}/uploads/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deleteToken }),
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

export async function adminLogin(username: string, password: string) {
  const response = await fetch(`${getApiBaseUrl()}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  return handleResponse<{ user: AdminUser; message: string }>(response);
}

export async function adminLogout() {
  const response = await fetch(`${getApiBaseUrl()}/admin/logout`, {
    method: 'POST',
    headers: getAdminHeaders(),
  });

  return handleResponse<{ message: string }>(response);
}

export async function getAdminMe() {
  const response = await fetch(`${getApiBaseUrl()}/admin/me`, {
    cache: 'no-store',
  });

  return handleResponse<{ user: AdminUser }>(response);
}

export async function getAdminSummary() {
  const response = await fetch(`${getApiBaseUrl()}/admin/summary`, {
    cache: 'no-store',
  });

  return handleResponse<AdminSummary>(response);
}

export async function getAdminLogs() {
  const response = await fetch(`${getApiBaseUrl()}/admin/logs`, {
    cache: 'no-store',
  });

  return handleResponse<{ items: AdminActionLogItem[]; total: number }>(response);
}

export async function getAdminBans() {
  const response = await fetch(`${getApiBaseUrl()}/admin/bans`, {
    cache: 'no-store',
  });

  return handleResponse<{ items: AdminBanItem[]; total: number }>(response);
}

export async function createAdminBan(payload: {
  banType: 'AUTHOR_HASH' | 'IP_HASH';
  valueHash: string;
  reason: string;
  expiresInHours?: number;
}) {
  const response = await fetch(`${getApiBaseUrl()}/admin/bans`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<{ item: AdminBanItem; message: string }>(response);
}

export async function revokeAdminBan(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/admin/bans/${id}/revoke`, {
    method: 'POST',
    headers: getAdminHeaders(),
  });

  return handleResponse<{ item: AdminBanItem; message: string }>(response);
}

export async function changeAdminPassword(currentPassword: string, newPassword: string) {
  const response = await fetch(`${getApiBaseUrl()}/admin/password`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  return handleResponse<{ message: string }>(response);
}

export async function getAdminReports(status = 'pending') {
  const response = await fetch(`${getApiBaseUrl()}/admin/reports?status=${status}`, {
    cache: 'no-store',
  });

  return handleResponse<{ items: ReportItem[]; total: number }>(response);
}

export async function adminHideTarget(
  target: 'thread' | 'post',
  id: number,
  reason?: string,
) {
  const response = await fetch(`${getApiBaseUrl()}/admin/${target}s/${id}/hide`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ reason }),
  });

  return handleResponse<{ message: string }>(response);
}

export async function adminResolveReport(
  id: number,
  hideTarget: boolean,
) {
  const response = await fetch(`${getApiBaseUrl()}/admin/reports/${id}/resolve`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({ hideTarget }),
  });

  return handleResponse<{ id: number; status: string }>(response);
}
