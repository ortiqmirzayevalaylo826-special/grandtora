import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Program, apiGet } from '@/lib/api';
import { ProgramCard } from '@/components/cards';

export const dynamic = 'force-dynamic';
const KINDS = ['EXCHANGE', 'DEGREE', 'SUMMER', 'RESEARCH', 'YOUTH'];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'programs' });
  return { title: t('title'), description: t('sub') };
}

export default async function Programs({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ kind?: string }> }) {
  const { locale } = await params;
  const { kind } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('programs');
  const k = await getTranslations('kind');
  const n = await getTranslations('nav');
  const active = kind && KINDS.includes(kind) ? kind : '';
  const list = (await apiGet<Program[]>(`/programs?locale=${locale}${active ? `&kind=${active}` : ''}`)) ?? [];
  const tab = (on: boolean) => `btn h-10 shrink-0 px-4 ${on ? 'btn-primary' : 'btn-ghost'}`;
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted"><Link href="/" className="hover:text-primary">{n('home')}</Link> / {n('programs')}</nav>
      <h1 className="text-3xl font-extrabold">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t('sub')}</p>
      {/* Kategoriyalar: mobilda gorizontal suriladi */}
      <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label={t('title')}>
        <Link href="/programs" className={tab(!active)} aria-current={!active ? 'page' : undefined}>{t('all')}</Link>
        {KINDS.map((x) => <Link key={x} href={`/programs?kind=${x}`} className={tab(active === x)} aria-current={active === x ? 'page' : undefined}>{k(x)}</Link>)}
      </div>
      <p className="mt-4 text-xs text-muted">{t('verify')}</p>
      {list.length > 0 ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((p) => <ProgramCard key={p.id} p={p} />)}</div>
      ) : (
        <div className="card mt-6 p-10 text-center text-muted">{t('none')}</div>
      )}
    </div>
  );
}
