import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { CountryDetail, apiGet } from '@/lib/api';
import ScholarshipCard from '@/components/ScholarshipCard';
import { ProgramCard } from '@/components/cards';
import Flag from '@/components/Flag';

export const dynamic = 'force-dynamic';
type P = { params: Promise<{ locale: string; code: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, code } = await params;
  const c = await apiGet<CountryDetail>(`/countries/${code}?locale=${locale}`);
  return { title: c?.name ?? 'Country', description: c?.info ?? undefined };
}

export default async function CountryPage({ params }: P) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('countries');
  const n = await getTranslations('nav');
  const c = await apiGet<CountryDetail>(`/countries/${code}?locale=${locale}`);
  if (!c) notFound();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-primary">{n('home')}</Link> / <Link href="/countries" className="hover:text-primary">{n('countries')}</Link> / {c.name}
      </nav>
      <header className="flex items-center gap-4">
        <Flag code={c.code} className="h-12 w-[72px]" />
        <h1 className="text-3xl font-extrabold sm:text-4xl">{c.name}</h1>
      </header>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {c.info && <div className="card p-5 md:col-span-2"><h2 className="text-sm font-bold uppercase tracking-wide text-muted">{t('system')}</h2><p className="mt-2 text-ink/85">{c.info}</p></div>}
        <div className="card p-5">
          {c.eduLang && <><h2 className="text-sm font-bold uppercase tracking-wide text-muted">{t('lang')}</h2><p className="mt-1 font-semibold text-navy">{c.eduLang}</p></>}
          {c.universities.length > 0 && <><h2 className="mt-4 text-sm font-bold uppercase tracking-wide text-muted">{t('unis')}</h2><ul className="mt-1 space-y-1 text-sm text-navy">{c.universities.map((u) => <li key={u}>• {u}</li>)}</ul></>}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-extrabold">{t('grantsHere')}</h2>
        {c.scholarships.length > 0
          ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{c.scholarships.map((s) => <ScholarshipCard key={s.id} s={s} />)}</div>
          : <div className="card p-8 text-center text-muted">{t('noGrants')}</div>}
      </section>
      {c.programs.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-extrabold">{t('programsHere')}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{c.programs.map((p) => <ProgramCard key={p.id} p={p} />)}</div>
        </section>
      )}
      <Link href="/countries" className="btn btn-ghost mt-10">← {t('back')}</Link>
    </div>
  );
}
