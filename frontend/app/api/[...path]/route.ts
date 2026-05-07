import { NextRequest } from 'next/server';
import { revalidateTag } from 'next/cache';

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE_URL ?? 'http://localhost:4000/api';

function normalizeApiBaseUrl(value: string) {
  return value
    .trim()
    .replace(/^BACKEND_API_BASE_URL\s*=\s*/, '')
    .replace(/^['"]|['"]$/g, '')
    .replace(/\/+$/, '');
}

function revalidatePublicContent(path: string[], method: string, status: number) {
  if (method === 'GET' || method === 'HEAD' || status < 200 || status >= 300) {
    return;
  }

  const [resource] = path;

  if (!['threads', 'posts', 'admin'].includes(resource)) {
    return;
  }

  revalidateTag('boards', { expire: 0 });
  revalidateTag('thread-lists', { expire: 0 });
  revalidateTag('threads', { expire: 0 });
}

async function proxy(request: NextRequest, path: string[]) {
  let targetUrl: URL;

  try {
    targetUrl = new URL(`${normalizeApiBaseUrl(BACKEND_API_BASE)}/${path.join('/')}`);
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });
  } catch {
    return Response.json(
      {
        message: 'Invalid BACKEND_API_BASE_URL configuration.',
      },
      { status: 502 },
    );
  }

  const headers = new Headers(request.headers);
  [
    'connection',
    'content-length',
    'forwarded',
    'host',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-port',
    'x-forwarded-proto',
    'x-real-ip',
  ].forEach((header) => headers.delete(header));

  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
    body:
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.arrayBuffer(),
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.duplex = 'half';
  }

  try {
    const response = await fetch(targetUrl, init);

    const responseHeaders = new Headers();
    const contentType = response.headers.get('content-type');

    if (contentType) {
      responseHeaders.set('content-type', contentType);
    }

    responseHeaders.set('cache-control', 'no-store');
    revalidatePublicContent(path, request.method, response.status);

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return Response.json(
      {
        message:
          error instanceof Error
            ? `백엔드 연결 실패: ${error.message}`
            : '백엔드 연결 실패',
      },
      { status: 502 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxy(request, path);
}
