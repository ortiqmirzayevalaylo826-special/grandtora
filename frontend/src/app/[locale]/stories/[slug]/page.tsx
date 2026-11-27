import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Story, apiGet, countryName } from '@/lib/api';
import { Avatar } from '@/components/cards';
import Flag from '@/components/Flag';

export const dynamic = 'force-dynamic';
type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await apiGet<Story>(`/stories/${slug}?locale=${locale}`);
  return { title: s ? `${s.name} — ${s.program}` : 'Story', description: s?.tr.quote };
}

export default async function StoryPage({ params }: P) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('stories');
  const n = await getTranslations('nav');
  const s = await apiGet<Story>(`/stories/${slug}?locale=${locale}`);
  if (!s) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-primary">{n('home')}</Link> / <Link href="/stories" className="hover:text-primary">{n('stories')}</Link> / {s.name}
      </nav>
      <header className="flex items-center gap-4">
        <Avatar name={s.name} size="h-20 w-20 text-2xl" />
        <div>
          <h1 className="text-3xl font-extrabold">{s.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            {s.countryCode && <Flag code={s.countryCode} className="h-4 w-6" />}
            {s.university}{s.country ? ` · ${countryName(s.country, locale)}` : ''}
          </p>
          <div className="mt-2 flex gap-2"><span className="chip">{s.program}</span>{s.isSample && <span className="chip bg-amber-100 !text-amber-800">{t('sample')}</span>}</div>
        </div>
      </header>
      {s.isSample && <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('sampleNote')}</p>}
      <blockquote className="mt-6 border-l-4 border-primary pl-4 text-xl font-semibold leading-snug text-navy">“{s.tr.quote}”</blockquote>
      <section className="mt-6 card p-5"><h2 className="text-sm font-bold uppercase tracking-wide text-muted">{t('prep')}</h2><p className="mt-2 text-ink/85">{s.tr.prep}</p></section>
      <p className="mt-6 leading-relaxed text-ink/85">{s.tr.text}</p>
      <Link href="/stories" className="btn btn-ghost mt-8">← {t('back')}</Link>
    </div>
  );
}
