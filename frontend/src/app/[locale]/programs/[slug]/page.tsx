import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Program, apiGet, countryName } from '@/lib/api';
import Flag from '@/components/Flag';

export const dynamic = 'force-dynamic';
type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await apiGet<Program>(`/programs/${slug}?locale=${locale}`);
  return { title: p?.tr.title ?? 'Program', description: p?.tr.summary };
}

export default async function ProgramPage({ params }: P) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('programs');
  const k = await getTranslations('kind');
  const n = await getTranslations('nav');
  const p = await apiGet<Program>(`/programs/${slug}?locale=${locale}`);
  if (!p) notFound();
  const rows: [string, string | undefined][] = [[t('who'), p.tr.who], [t('duration'), p.tr.duration], [t('funding'), p.tr.funding], [t('req'), p.tr.req]];
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-primary">{n('home')}</Link> / <Link href="/programs" className="hover:text-primary">{n('programs')}</Link> / {p.tr.title}
      </nav>
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">{k(p.kind)}</span>
        {p.countryCode && <span className="flex items-center gap-2 text-sm text-muted"><Flag code={p.countryCode} />{countryName(p.country ?? undefined, locale)}</span>}
      </div>
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{p.tr.title}</h1>
      <p className="mt-1 text-sm font-semibold text-muted">{p.organization}</p>
      <p className="mt-5 text-lg text-ink/85">{p.tr.summary}</p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        {rows.map(([l, v]) => v && (
          <div key={l} className="card p-5"><dt className="text-xs font-bold uppercase tracking-wide text-muted">{l}</dt><dd className="mt-1 text-sm text-navy">{v}</dd></div>
        ))}
      </dl>
      <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('verify')}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={p.officialUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">{t('official')} ↗</a>
        <Link href="/programs" className="btn btn-ghost">← {t('back')}</Link>
      </div>
    </div>
  );
}
