// Server komponentlari uchun (to'g'ridan-to'g'ri API ga), brauzer uchun esa '/api/...' (rewrite orqali).
const BASE = process.env.API_URL ?? 'http://localhost:4000';

export interface Scholarship {
  id: string; slug: string; organization: string; countryCode: string; country?: { code: string; nameUz: string; nameRu: string; nameEn: string };
  levels: string[]; fields: string[]; funding: string; languageReq: string | null; ieltsMin: number | null; gpaMin: number | null;
  deadline: string | null; rolling: boolean; officialUrl: string; isDemo: boolean; lastVerifiedAt: string | null; noEssay: boolean;
  tr?: { title: string; summary: string; description?: string | null; eligibility?: string | null; documents: string[]; process: string[] };
}
export interface Paged<T> { total: number; page: number; limit: number; pages: number; items: T[] }

export interface Program {
  id: string; slug: string; kind: string; organization: string; countryCode: string | null; officialUrl: string;
  country?: { code: string; nameUz: string; nameRu: string; nameEn: string } | null;
  tr: { title?: string; summary?: string; who?: string; duration?: string; funding?: string; req?: string };
}
export interface Story {
  id: string; slug: string; name: string; university: string; countryCode: string | null; program: string; photoUrl: string | null; isSample: boolean;
  country?: { code: string; nameUz: string; nameRu: string; nameEn: string } | null;
  tr: { quote?: string; prep?: string; text?: string };
}
export interface CountryCard { code: string; name: string; universities: string[]; eduLang: string | null; info: string | null; scholarships: number; programs: number }
export interface CountryDetail extends Omit<CountryCard, 'scholarships' | 'programs'> { scholarships: Scholarship[]; total: number; programs: Program[] }
export interface PublicStats { scholarships: number; countries: number; programs: number; students: number }

/** Render bepul rejasida API uxlab qolishi mumkin (birinchi so'rov ~30-50 s): shuning uchun uzoqroq kutamiz. */
export async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${BASE}/api${path}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(25_000) });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null; // API o'chiq bo'lsa sahifa yiqilmasin
  }
}
export const countryName = (c: Scholarship['country'], locale: string) => (c ? (locale === 'ru' ? c.nameRu : locale === 'en' ? c.nameEn : c.nameUz) : '');
export const daysLeft = (d: string | null) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 864e5) : null);
