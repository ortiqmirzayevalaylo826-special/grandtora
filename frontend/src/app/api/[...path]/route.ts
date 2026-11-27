import type { NextRequest } from 'next/server';

// API'ga o'tkazuvchi (proxy). API_URL ish vaqtida o'qiladi (build paytida emas), shuning uchun Render'da
// o'zgartirilgan manzil qayta build'siz ishlaydi. Brauzer o'sha domenga murojaat qiladi => cookie muammosiz.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const base = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
  const url = `${base}/api/${path.join('/')}${req.nextUrl.search}`;
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');
  const ip = req.headers.get('x-forwarded-for');
  if (ip) headers.set('x-forwarded-for', ip);
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  try {
    const r = await fetch(url, { method: req.method, headers, body: hasBody ? req.body : undefined, redirect: 'manual', duplex: 'half', signal: AbortSignal.timeout(60_000) } as RequestInit);
    const out = new Headers(r.headers);
    out.delete('content-encoding');
    out.delete('content-length');
    out.delete('transfer-encoding');
    return new Response(r.body, { status: r.status, headers: out });
  } catch {
    return Response.json({ message: 'api_unreachable', statusCode: 502 }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
