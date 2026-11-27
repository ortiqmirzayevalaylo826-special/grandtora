'use client';
import { use } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useQuery } from '@/lib/client';
import { Scholarship, countryName, daysLeft } from '@/lib/api';
import { Empty, ErrorBox, Spinner } from '@/components/ui';
import Flag from '@/components/Flag';
import DetailActions from '@/components/DetailActions';

/** Grant sahifasi kabinet ichida: orqaga qaytish ham kabinet katalogiga olib boradi. */
export default function AppGrantDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const t = useTranslations();
  const locale = useLocale();
  const { data: s, error, loading, reload } = useQuery<Scholarship>(`/scholarships/${slug}?locale=${locale}`);
  const rv = useQuery<{ avg: number | null; count: number; items: { id: string; stars: number; text: string; author: string }[] }>(`/scholarships/${slug}/reviews`);
  if (loading && !s) return <Spinner />;
  if (error === 'generic' || (!s && !loading && error)) return <div className="space-y-4"><Link href="/app/grants" className="text-sm text-muted hover:text-primary">← {t('detail.back')}</Link><Empty text={t('catalog.none')} /></div>;
  if (!s) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  const d = daysLeft(s.deadline);
  const checked = s.lastVerifiedAt ? Math.round((Date.now() - new Date(s.lastVerifiedAt).getTime()) / 864e5) : null;
  const reqs = [s.ieltsMin && `IELTS ≥ ${s.ieltsMin}`, s.gpaMin && `GPA ≥ ${s.gpaMin}`, s.languageReq && `${s.languageReq}`].filter(Boolean) as string[];
  return (
    <div className="space-y-4">
      <Link href="/app/grants" className="text-sm text-muted hover:text-primary">← {t('detail.back')}</Link>
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <article className="card p-5 sm:p-6">
          <div className="flex items-start gap-3"><Flag code={s.countryCode} className="mt-1 h-8 w-12" /><div className="min-w-0"><h1 className="break-words text-2xl font-extrabold sm:text-3xl">{s.tr?.title}</h1><p className="mt-1 text-muted">{s.organization} · {countryName(s.country, locale)}</p></div></div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip">{t(`funding.${s.funding}`)}</span>
            {s.levels.map((l) => <span key={l} className="chip">{t(`level.${l}`)}</span>)}
            {s.isDemo && <span className="chip bg-amber-100 !text-amber-800">{t('card.demo')}</span>}
          </div>
          <p className="mt-5 whitespace-pre-line break-words leading-relaxed">{s.tr?.description ?? s.tr?.summary}</p>
          {reqs.length > 0 && (<><h2 className="mt-6 text-lg font-bold">{t('detail.requirements')}</h2><ul className="mt-2 list-disc pl-5">{reqs.map((r) => <li key={r}>{r}</li>)}</ul></>)}
          {!!s.tr?.documents?.length && (<><h2 className="mt-6 text-lg font-bold">{t('detail.docs')}</h2><ul className="mt-2 list-disc pl-5">{s.tr.documents.map((r) => <li key={r}>{r}</li>)}</ul></>)}
          {!!s.tr?.process?.length && (<><h2 className="mt-6 text-lg font-bold">{t('detail.process')}</h2><ol className="mt-2 list-decimal pl-5">{s.tr.process.map((r) => <li key={r}>{r}</li>)}</ol></>)}
          <h2 className="mt-8 text-lg font-bold">{t('detail.reviews')}{rv.data?.avg ? <span className="ml-2 text-amber-500">★ {rv.data.avg}</span> : null}</h2>
          {rv.data?.items.length ? (
            <ul className="mt-3 space-y-3">{rv.data.items.map((r) => <li key={r.id} className="rounded-xl bg-canvas p-3 text-sm"><b className="text-amber-500">{'★'.repeat(r.stars)}</b> <span className="font-semibold text-navy">{r.author}</span><p className="mt-1 text-ink/80">{r.text}</p></li>)}</ul>
          ) : <p className="mt-2 text-sm text-muted">{t('detail.noReviews')}</p>}
        </article>
        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-sm text-muted">{t('card.ends')}</p>
            <p className="font-head text-2xl font-extrabold text-navy">{s.rolling ? t('card.rolling') : s.deadline ? new Date(s.deadline).toLocaleDateString(locale) : '—'}</p>
            {d !== null && d >= 0 && <p className="mt-1 text-sm font-semibold text-primary-600">{t('card.daysLeft', { n: d })}</p>}
            <a href={s.officialUrl} target="_blank" rel="noopener noreferrer nofollow" className="btn btn-primary mt-4 w-full">{t('detail.official')}</a>
            {checked !== null && <p className="mt-3 text-xs text-muted">{t('detail.verified', { n: checked })}</p>}
            <DetailActions id={s.id} />
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t('detail.scam')}</div>
        </aside>
      </div>
    </div>
  );
}
