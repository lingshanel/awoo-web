import { NextRequest } from 'next/server';

const BACKEND_API_BASE =
  process.env.BACKEND_API_BASE_URL ?? 'http://localhost:4000/api';

async function proxy(request: NextRequest, path: string[]) {
  const targetUrl = new URL(`${BACKEND_API_BASE}/${path.join('/')}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');

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

    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
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
