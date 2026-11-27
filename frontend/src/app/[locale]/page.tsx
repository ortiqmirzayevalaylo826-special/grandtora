import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { CountryCard, Paged, Program, PublicStats, Scholarship, Story, apiGet } from '@/lib/api';
import ScholarshipCard from '@/components/ScholarshipCard';
import { CountryTile, ProgramCard, StoryCard } from '@/components/cards';
import { Icon } from '@/components/ui';

export const dynamic = 'force-dynamic';

const QUICK = ['Erasmus+', 'DAAD', 'Fulbright', 'Chevening'];

function SectionHead({ title, sub, href, all }: { title: string; sub?: string; href?: string; all?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-2xl font-extrabold sm:text-3xl">{title}</h2>
        {sub && <p className="mt-1 max-w-2xl text-sm text-muted">{sub}</p>}
      </div>
      {href && all && <Link href={href} className="shrink-0 text-sm font-semibold text-primary hover:underline">{all} →</Link>}
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
    apiGet<Paged<Scholarship>>(`/scholarships?limit=4&sort=popular&locale=${locale}`),
    apiGet<Paged<Scholarship>>(`/scholarships?limit=4&sort=new&locale=${locale}`),
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
      {/* HERO: o'ngdagi rasm fonga chiqadi, chap tomonda matn va qidiruv */}
      <section className="relative overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/hero.jpg" alt="" width={1341} height={552} fetchPriority="high"
          className="absolute inset-y-0 right-0 hidden h-full w-[62%] object-cover object-[60%_30%] lg:block" />
        <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[62%] bg-gradient-to-r from-white via-white/70 to-transparent lg:block" />
        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14 lg:py-20">
          <div className="max-w-xl lg:max-w-[540px]">
            <h1 className="text-4xl font-extrabold leading-[1.1] sm:text-5xl">{t('title')}</h1>
            <p className="mt-4 text-base text-ink/75 sm:text-lg">{t('sub')}</p>
            <form action={`/${locale}/scholarships`} className="mt-7 grid grid-cols-1 gap-2 rounded-2xl border border-navy/10 bg-white p-2 shadow-card sm:grid-cols-2">
              <input name="q" className="input sm:col-span-2" placeholder={t('search')} aria-label={t('search')} />
              <select name="countries" className="input" aria-label={t('country')} defaultValue="">
                <option value="">{t('country')}</option>
                {(countries ?? []).filter((c) => c.scholarships > 0).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <select name="levels" className="input" aria-label={t('level')} defaultValue="">
                <option value="">{t('level')}</option>
                {['BACHELOR', 'MASTER', 'PHD', 'POSTDOC', 'SHORT'].map((l) => <option key={l} value={l}>{lv(l)}</option>)}
              </select>
              <button className="btn btn-primary sm:col-span-2">{t('go')}</button>
            </form>
            <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span>{t('popularQ')}</span>
              {QUICK.map((q) => <Link key={q} href={`/scholarships?q=${encodeURIComponent(q)}`} className="chip hover:bg-primary hover:!text-white">{q}</Link>)}
            </p>
          </div>
          {/* Mobil va planshetda rasm matn ostida alohida blok */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/hero.jpg" alt="" width={1341} height={552} className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover object-[60%_30%] shadow-card lg:hidden" />
        </div>
      </section>

      {/* STATISTIKA: faqat haqiqiy sonlar */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-3 py-8 sm:grid-cols-4">
          {numbers.map((n) => (
            <div key={n.l} className="flex min-w-0 items-center gap-3 rounded-2xl border border-navy/10 bg-white p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><Icon name={n.i} /></span>
              <div className="min-w-0"><p className="font-head text-2xl font-extrabold text-navy">{n.v ?? '—'}</p><p className="text-xs leading-tight text-muted">{n.l}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* MUVAFFAQIYAT HIKOYALARI (namuna belgisi bilan) */}
      {stories && stories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-4">
          <SectionHead title={t('storiesTitle')} sub={stories.some((s) => s.isSample) ? t('storiesNote') : undefined} href="/stories" all={t('all')} />
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {stories.slice(0, 3).map((s) => <div key={s.id} className="w-[85%] shrink-0 snap-start md:w-auto"><StoryCard s={s} /></div>)}
          </div>
        </section>
      )}

      {/* MASHHUR VA YANGI GRANTLAR */}
      {popular && popular.items.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <SectionHead title={t('popular')} sub={t('demoNote')} href="/scholarships?sort=popular" all={t('all')} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{popular.items.map((s) => <ScholarshipCard key={s.id} s={s} />)}</div>
        </section>
      )}
      {recent && recent.items.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <SectionHead title={t('recent')} href="/scholarships?sort=new" all={t('all')} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{recent.items.map((s) => <ScholarshipCard key={s.id} s={s} />)}</div>
        </section>
      )}

      {/* XALQARO DASTURLAR */}
      {programs && programs.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <SectionHead title={t('programsTitle')} sub={t('programsSub')} href="/programs" all={t('all')} />
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {programs.slice(0, 4).map((p) => <div key={p.id} className="w-[82%] shrink-0 snap-start sm:w-auto"><ProgramCard p={p} /></div>)}
          </div>
        </section>
      )}

      {/* DAVLATLAR */}
      {top.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <SectionHead title={t('countriesTitle')} href="/countries" all={t('all')} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{top.map((c) => <CountryTile key={c.code} c={c} />)}</div>
        </section>
      )}

      {/* YAKUNIY BANNER */}
      <section className="mx-auto max-w-6xl px-4 py-16">
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
