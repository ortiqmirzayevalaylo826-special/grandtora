import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { PublicStats, apiGet } from '@/lib/api';
import { Icon } from '@/components/ui';

export const dynamic = 'force-dynamic';
export const fetchCache = 'default-cache'; // ma'lumot 60 soniya keshlanadi: sahifa API'ni kutmaydi

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return { title: t('title'), description: t('lead') };
}

export default async function About({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');
  const h = await getTranslations('home');
  const stats = await apiGet<PublicStats>('/public/stats');
  const nums = [
    { v: stats?.scholarships, l: h('statGrants'), i: 'star' }, { v: stats?.countries, l: h('statCountries'), i: 'globe' },
    { v: stats?.programs, l: h('statPrograms'), i: 'folder' }, { v: stats?.students, l: h('statStudents'), i: 'users' },
  ];
  const help = ['help1', 'help2', 'help3', 'help4'] as const;
  const feat = [['feat1', 'search'], ['feat2', 'list'], ['feat3', 'file'], ['feat4', 'bell']] as const;
  const fut = ['future1', 'future2', 'future3'] as const;
  return (
    <div>
      <section className="bg-gradient-to-br from-white via-canvas to-accent/60">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h1 className="text-4xl font-extrabold sm:text-5xl">{t('title')}</h1>
            <p className="mt-4 max-w-xl text-lg text-ink/80">{t('lead')}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/campus.jpg" alt="" width={768} height={888} className="mx-auto aspect-[4/3] w-full max-w-md rounded-3xl object-cover shadow-card" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-12">
        <section className="grid gap-6 md:grid-cols-2">
          <div className="card p-6"><h2 className="text-xl font-bold">{t('whatT')}</h2><p className="mt-2 text-ink/85">{t('whatP')}</p></div>
          <div className="card p-6"><h2 className="text-xl font-bold">{t('missionT')}</h2><p className="mt-2 text-ink/85">{t('missionP')}</p></div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-extrabold">{t('helpT')}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {help.map((k) => <li key={k} className="card flex items-start gap-3 p-4"><span className="mt-0.5 text-primary"><Icon name="log" /></span><span className="text-sm text-ink/85">{t(k)}</span></li>)}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-extrabold">{t('featT')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {feat.map(([k, i]) => <div key={k} className="card p-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary"><Icon name={i} /></span><p className="mt-3 font-semibold text-navy">{t(k)}</p></div>)}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {nums.map((n) => <div key={n.l} className="rounded-2xl border border-navy/10 bg-white p-5 text-center"><p className="font-head text-3xl font-extrabold text-primary">{n.v ?? '—'}</p><p className="mt-1 text-xs text-muted">{n.l}</p></div>)}
        </section>

        <section className="rounded-3xl bg-navy p-8 text-white">
          <h2 className="text-2xl font-extrabold !text-white">{t('trustT')}</h2>
          <p className="mt-3 max-w-3xl text-white/85">{t('trustP')}</p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="card p-6"><h2 className="text-xl font-bold">{t('futureT')}</h2><ul className="mt-3 space-y-2 text-sm text-ink/85">{fut.map((k) => <li key={k}>• {t(k)}</li>)}</ul></div>
          <div className="card p-6"><h2 className="text-xl font-bold">{t('teamT')}</h2><p className="mt-2 text-sm text-ink/85">{t('teamP')}</p></div>
        </section>

        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/register" className="btn btn-primary">{h('register')}</Link>
          <Link href="/scholarships" className="btn btn-ghost">{h('browse')}</Link>
        </div>
      </div>
    </div>
  );
}
