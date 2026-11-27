import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { CountryCard, apiGet } from '@/lib/api';
import { CountryTile } from '@/components/cards';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'countries' });
  return { title: t('title'), description: t('sub') };
}

export default async function Countries({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('countries');
  const n = await getTranslations('nav');
  const list = (await apiGet<CountryCard[]>(`/countries?locale=${locale}`)) ?? [];
  // Grantlari bor davlatlar oldinda
  const sorted = [...list].sort((a, b) => b.scholarships + b.programs - (a.scholarships + a.programs));
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted"><Link href="/" className="hover:text-primary">{n('home')}</Link> / {n('countries')}</nav>
      <h1 className="text-3xl font-extrabold">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t('sub')}</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{sorted.map((c) => <CountryTile key={c.code} c={c} />)}</div>
    </div>
  );
}
