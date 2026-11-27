'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Server xatosi: code — API qaytargan qisqa kod (masalan "otp_wrong"), errors.* tarjimalariga mos. */
export class ApiError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

let refreshing: Promise<boolean> | null = null;
/** Access token (15 daqiqa) tugaganda refresh cookie orqali yangisini oladi. Bir vaqtda bitta so'rov. */
export function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      .then((r) => r.ok).catch(() => false)
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

interface Opts { method?: string; body?: unknown; form?: FormData }

export async function api<T = any>(path: string, o: Opts = {}): Promise<T> {
  const init = (): RequestInit => {
    const h: Record<string, string> = {};
    let body: BodyInit | undefined;
    if (o.form) body = o.form;
    else if (o.body !== undefined) { h['Content-Type'] = 'application/json'; body = JSON.stringify(o.body); }
    return { method: o.method ?? (o.body !== undefined || o.form ? 'POST' : 'GET'), credentials: 'include', headers: h, body };
  };
  let r: Response;
  try { r = await fetch(`/api${path}`, init()); } catch { throw new ApiError(0, 'network'); }
  if (r.status === 401 && !path.startsWith('/auth/') && (await refreshSession())) {
    try { r = await fetch(`/api${path}`, init()); } catch { throw new ApiError(0, 'network'); }
  }
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    const m = Array.isArray(j.message) ? j.message[0] : j.message;
    throw new ApiError(r.status, typeof m === 'string' ? m : 'generic');
  }
  if (r.status === 204) return null as T;
  return (await r.json().catch(() => null)) as T;
}

const qcache = new Map<string, unknown>();
/** Chiqishda yoki hisob almashganda: boshqa foydalanuvchi ma'lumoti ko'rinib qolmasin. */
export const clearQueryCache = () => qcache.clear();

/** Ma'lumot yuklovchi hook. Oldin ko'rilgan sahifa DARHOL ochiladi (kesh), yangisi fonda yuklanib almashadi. path=null bo'lsa so'rov yuborilmaydi. */
export function useQuery<T = any>(path: string | null) {
  const [data, setData] = useState<T | null>(() => (path && qcache.has(path) ? (qcache.get(path) as T) : null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path && !qcache.has(path));
  const [n, setN] = useState(0);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    if (!path) { setLoading(false); return; }
    let off = false;
    if (qcache.has(path)) { setData(qcache.get(path) as T); setLoading(false); } else setLoading(true);
    api<T>(path)
      .then((d) => { if (!off) { qcache.set(path, d); setData(d); setError(null); } })
      .catch((e: ApiError) => { if (!off) setError(e.code ?? 'generic'); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [path, n]);
  const reload = useCallback(() => setN((x) => x + 1), []);
  return { data, error, loading, reload, setData };
}
