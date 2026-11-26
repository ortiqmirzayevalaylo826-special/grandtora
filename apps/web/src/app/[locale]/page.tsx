import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Paged, Scholarship, apiGet } from '@/lib/api';
import ScholarshipCard from '@/components/ScholarshipCard';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const data = await apiGet<Paged<Scholarship>>(`/scholarships?limit=6&locale=${locale}`);
  return (
    <>
      <section className="bg-navy py-20 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-5xl">{t('title')}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">{t('sub')}</p>
          <form action={`/${locale}/scholarships`} className="mt-8 flex max-w-2xl gap-2">
            <input name="q" className="input h-12 flex-1 !border-transparent" placeholder={t('search')} aria-label={t('search')} />
            <button className="btn btn-primary h-12">{t('go')}</button>
          </form>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <p className="text-sm text-muted">{t('demoNote')}</p>
          <Link href="/scholarships" className="btn btn-ghost">{t('browse')}</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((s) => <ScholarshipCard key={s.id} s={s} />)}
        </div>
      </section>
    </>
  );
}
