// Server komponentlari uchun (to'g'ridan-to'g'ri API ga), brauzer uchun esa '/api/...' (rewrite orqali).
const BASE = process.env.API_URL ?? 'http://localhost:4000';

export interface Scholarship {
  id: string; slug: string; organization: string; countryCode: string; country?: { code: string; nameUz: string; nameRu: string; nameEn: string };
  levels: string[]; fields: string[]; funding: string; languageReq: string | null; ieltsMin: number | null; gpaMin: number | null;
  deadline: string | null; rolling: boolean; officialUrl: string; isDemo: boolean; lastVerifiedAt: string | null; noEssay: boolean;
  tr?: { title: string; summary: string; description?: string | null; eligibility?: string | null; documents: string[]; process: string[] };
}
export interface Paged<T> { total: number; page: number; limit: number; pages: number; items: T[] }

export async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${BASE}/api${path}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null; // API o'chiq bo'lsa sahifa yiqilmasin
  }
}
export const countryName = (c: Scholarship['country'], locale: string) => (c ? (locale === 'ru' ? c.nameRu : locale === 'en' ? c.nameEn : c.nameUz) : '');
export const daysLeft = (d: string | null) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 864e5) : null);
