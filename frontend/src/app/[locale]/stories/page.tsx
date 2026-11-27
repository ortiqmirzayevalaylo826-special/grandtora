import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Story, apiGet } from '@/lib/api';
import { StoryCard } from '@/components/cards';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'stories' });
  return { title: t('title'), description: t('sub') };
}

export default async function Stories({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('stories');
  const n = await getTranslations('nav');
  const list = (await apiGet<Story[]>(`/stories?locale=${locale}`)) ?? [];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted"><Link href="/" className="hover:text-primary">{n('home')}</Link> / {n('stories')}</nav>
      <h1 className="text-3xl font-extrabold">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t('sub')}</p>
      {list.some((s) => s.isSample) && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('sampleNote')}</p>}
      {list.length > 0
        ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((s) => <StoryCard key={s.id} s={s} />)}</div>
        : <div className="card mt-6 p-10 text-center text-muted">{t('none')}</div>}
    </div>
  );
}
