import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { CountryCard, Paged, Program, PublicStats, Scholarship, Story, apiGet } from '@/lib/api';
import ScholarshipCard from '@/components/ScholarshipCard';
import { CountryTile, ProgramCard, StoryCard } from '@/components/cards';
import Flag from '@/components/Flag';
import { Icon } from '@/components/ui';

export const dynamic = 'force-dynamic';

const QUICK = ['DAAD', 'Chevening', 'Fulbright', 'MEXT'];

function SectionHead({ title, sub, href, all }: { title: string; sub?: string; href?: string; all?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
        {sub && <p className="mt-1 max-w-2xl text-sm text-muted">{sub}</p>}
      </div>
      {href && all && <Link href={href} className="text-sm font-semibold text-primary hover:underline">{all} →</Link>}
    </div>
  );
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const lv = await getTranslations('level');
  const [stats, popular, recent, programs, countries, stories] = await Promise.all([
    apiGet<PublicStats>('/public/stats'),
    apiGet<Paged<Scholarship>>(`/scholarships?limit=3&sort=popular&locale=${locale}`),
    apiGet<Paged<Scholarship>>(`/scholarships?limit=3&sort=new&locale=${locale}`),
    apiGet<Program[]>(`/programs?locale=${locale}`),
    apiGet<CountryCard[]>(`/countries?locale=${locale}`),
    apiGet<Story[]>(`/stories?locale=${locale}`),
  ]);
  const numbers = [
    { v: stats?.scholarships, l: t('statGrants'), i: 'star' },
    { v: stats?.countries, l: t('statCountries'), i: 'globe' },
    { v: stats?.programs, l: t('statPrograms'), i: 'folder' },
    { v: stats?.students, l: t('statStudents'), i: 'users' },
  ];
  const top = (countries ?? []).filter((c) => c.scholarships > 0 || c.programs > 0).slice(0, 8);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-canvas to-accent/60">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.1] sm:text-5xl">{t('title')}</h1>
            <p className="mt-4 max-w-xl text-base text-ink/75 sm:text-lg">{t('sub')}</p>
            <form action={`/${locale}/scholarships`} className="mt-7 grid gap-2 rounded-2xl border border-navy/10 bg-white p-2 shadow-card sm:grid-cols-[1.4fr_1fr_1fr_auto]">
              <input name="q" className="input !border-transparent" placeholder={t('search')} aria-label={t('search')} />
              <select name="countries" className="input !border-transparent" aria-label={t('country')} defaultValue="">
                <option value="">{t('country')}</option>
                {(countries ?? []).filter((c) => c.scholarships > 0).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <select name="levels" className="input !border-transparent" aria-label={t('level')} defaultValue="">
                <option value="">{t('level')}</option>
                {['BACHELOR', 'MASTER', 'PHD'].map((l) => <option key={l} value={l}>{lv(l)}</option>)}
              </select>
              <button className="btn btn-primary h-11">{t('go')}</button>
            </form>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>{t('popularQ')}</span>
              {QUICK.map((q) => <Link key={q} href={`/scholarships?q=${q}`} className="chip hover:bg-primary hover:!text-white">{q}</Link>)}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/scholarships" className="btn btn-primary">{t('browse')}</Link>
              <Link href="/register" className="btn btn-ghost">{t('register')}</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/campus.jpg" alt="" width={768} height={888} className="aspect-[4/4.4] w-full rounded-[28px] object-cover shadow-card" />
            <div className="absolute -bottom-4 left-4 flex items-center gap-3 rounded-2xl border border-navy/10 bg-white px-4 py-3 shadow-card">
              <Flag code="DE" /><Flag code="US" /><Flag code="TR" /><Flag code="JP" />
              <span className="text-xs font-bold text-navy">+{Math.max((stats?.countries ?? 10) - 4, 0)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTIKA: faqat haqiqiy sonlar */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="-mt-1 grid grid-cols-2 gap-3 py-8 sm:grid-cols-4">
          {numbers.map((n) => (
            <div key={n.l} className="flex items-center gap-3 rounded-2xl border border-navy/10 bg-white p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary"><Icon name={n.i} /></span>
              <div><p className="font-head text-2xl font-extrabold text-navy">{n.v ?? '—'}</p><p className="text-xs text-muted">{n.l}</p></div>
            </div>
          ))}
        </div>
        <p className="-mt-4 text-xs text-muted">{t('statNote')}</p>
      </section>

      {/* MASHHUR VA YANGI GRANTLAR */}
      {popular && popular.items.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <SectionHead title={t('popular')} sub={t('demoNote')} href="/scholarships?sort=popular" all={t('all')} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{popular.items.map((s) => <ScholarshipCard key={s.id} s={s} />)}</div>
        </section>
      )}
      {recent && recent.items.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12">
          <SectionHead title={t('recent')} href="/scholarships?sort=new" all={t('all')} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{recent.items.map((s) => <ScholarshipCard key={s.id} s={s} />)}</div>
        </section>
      )}

      {/* XALQARO DASTURLAR */}
      {programs && programs.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <SectionHead title={t('programsTitle')} sub={t('programsSub')} href="/programs" all={t('all')} />
          {/* Mobilda gorizontal suriladi */}
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {programs.slice(0, 4).map((p) => <div key={p.id} className="w-[82%] shrink-0 snap-start sm:w-auto"><ProgramCard p={p} /></div>)}
          </div>
        </section>
      )}

      {/* DAVLATLAR */}
      {top.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <SectionHead title={t('countriesTitle')} href="/countries" all={t('all')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{top.slice(0, 8).map((c) => <CountryTile key={c.code} c={c} />)}</div>
        </section>
      )}

      {/* HIKOYALAR (namuna belgisi bilan) */}
      {stories && stories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <SectionHead title={t('storiesTitle')} sub={stories.some((s) => s.isSample) ? t('storiesNote') : undefined} href="/stories" all={t('all')} />
          <div className="grid gap-5 md:grid-cols-3">{stories.slice(0, 3).map((s) => <StoryCard key={s.id} s={s} />)}</div>
        </section>
      )}

      {/* YAKUNIY BANNER */}
      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-navy px-6 py-12 text-center text-white sm:px-12">
          <h2 className="mx-auto max-w-2xl text-3xl font-extrabold !text-white">{t('ctaTitle')}</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">{t('ctaSub')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn bg-white text-primary-600 hover:bg-accent">{t('register')}</Link>
            <Link href="/scholarships" className="btn border border-white/40 text-white hover:bg-white/10">{t('browse')}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
