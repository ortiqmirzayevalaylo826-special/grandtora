import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Scholarship, apiGet, countryName, daysLeft } from '@/lib/api';
import { SITE_URL } from '@/brand';
import DetailActions from '@/components/DetailActions';

export const dynamic = 'force-dynamic';

type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await apiGet<Scholarship>(`/scholarships/${slug}?locale=${locale}`);
  return s ? { title: s.tr?.title, description: s.tr?.summary } : {};
}

export default async function Detail({ params }: P) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const s = await apiGet<Scholarship>(`/scholarships/${slug}?locale=${locale}`);
  if (!s) notFound();
  const rv = await apiGet<{ avg: number | null; count: number; items: { id: string; stars: number; text: string; author: string }[] }>(`/scholarships/${slug}/reviews`);
  const d = daysLeft(s.deadline);
  const checked = s.lastVerifiedAt ? Math.round((Date.now() - new Date(s.lastVerifiedAt).getTime()) / 864e5) : null;

  // SEO: Google qidiruvi uchun tuzilgan ma'lumot (schema.org)
  const ld = { '@context': 'https://schema.org', '@type': 'MonetaryGrant', name: s.tr?.title, description: s.tr?.summary, url: `${SITE_URL}/${locale}/scholarships/${s.slug}`, funder: { '@type': 'Organization', name: s.organization } };

  const reqs = [s.ieltsMin && `IELTS ≥ ${s.ieltsMin}`, s.gpaMin && `GPA ≥ ${s.gpaMin}`, s.languageReq && `${s.languageReq}`].filter(Boolean) as string[];
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <Link href="/scholarships" className="text-sm text-muted hover:text-primary">← {t('detail.back')}</Link>
      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_280px]">
        <article className="card p-6">
          <h1 className="text-3xl font-extrabold">{s.tr?.title}</h1>
          <p className="mt-1 text-muted">{s.organization} · {countryName(s.country, locale)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip">{t(`funding.${s.funding}`)}</span>
            {s.levels.map((l) => <span key={l} className="chip">{t(`level.${l}`)}</span>)}
            {s.isDemo && <span className="chip bg-amber-100 !text-amber-800">{t('card.demo')}</span>}
          </div>
          <p className="mt-5 leading-relaxed">{s.tr?.description ?? s.tr?.summary}</p>
          {reqs.length > 0 && (<><h2 className="mt-6 text-lg font-bold">{t('detail.requirements')}</h2><ul className="mt-2 list-disc pl-5">{reqs.map((r) => <li key={r}>{r}</li>)}</ul></>)}
          {!!s.tr?.documents?.length && (<><h2 className="mt-6 text-lg font-bold">{t('detail.docs')}</h2><ul className="mt-2 list-disc pl-5">{s.tr.documents.map((r) => <li key={r}>{r}</li>)}</ul></>)}
          {!!s.tr?.process?.length && (<><h2 className="mt-6 text-lg font-bold">{t('detail.process')}</h2><ol className="mt-2 list-decimal pl-5">{s.tr.process.map((r) => <li key={r}>{r}</li>)}</ol></>)}
          <h2 className="mt-8 text-lg font-bold">{t('detail.reviews')}{rv?.avg ? <span className="ml-2 text-amber-500">★ {rv.avg}</span> : null}</h2>
          {rv?.items.length ? (
            <ul className="mt-3 space-y-3">{rv.items.map((r) => (
              <li key={r.id} className="rounded-xl bg-canvas p-3 text-sm"><b className="text-amber-500">{'★'.repeat(r.stars)}</b> <span className="font-semibold text-navy">{r.author}</span><p className="mt-1 text-ink/80">{r.text}</p></li>
            ))}</ul>
          ) : <p className="mt-2 text-sm text-muted">{t('detail.noReviews')}</p>}
        </article>
        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-sm text-muted">{t('card.ends')}</p>
            <p className="font-head text-2xl font-extrabold text-navy">{s.rolling ? t('card.rolling') : s.deadline ? new Date(s.deadline).toLocaleDateString(locale) : '—'}</p>
            {d !== null && d >= 0 && <p className="mt-1 text-sm font-semibold text-primary-600">{t('card.daysLeft', { n: d })}</p>}
            {/* rel: tashqi sayt; yangi oynada */}
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
