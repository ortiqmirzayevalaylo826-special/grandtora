'use client';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@/lib/client';
import { countryName, daysLeft } from '@/lib/api';
import { Bar, ErrorBox, Icon, Spinner } from '@/components/ui';
import Flag from '@/components/Flag';
import { useL } from '@/components/admin/kit';

/** Talaba bosh sahifasi: salomlashuv banneri, 4 ta statistika, tavsiya etilgan grantlar, yaqin muddatlar, profil to'liqligi. */
export default function Overview() {
  const t = useTranslations('ov');
  const st = useTranslations('status');
  const c = useTranslations();
  const L = useL();
  const locale = useLocale();
  const { user } = useAuth();
  const { data, error, loading, reload } = useQuery<any>(`/me/overview?locale=${locale}`);
  const rec = useQuery<any[]>(`/me/recommended?locale=${locale}`);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  const cards = [
    { k: 'saved', n: data.saved, href: '/app/saved', icon: 'heart' },
    { k: 'apps', n: data.applications, href: '/app/applications', icon: 'file' },
    { k: 'deadlines', n: data.upcoming.length, href: '/app/calendar', icon: 'calendar', label: L('Yaqin muddatlar', 'Ближайшие сроки', 'Upcoming deadlines') },
    { k: 'unread', n: data.unread, href: '/app/notifications', icon: 'bell', label: L('Yangi bildirishnomalar', 'Новые уведомления', 'New notifications') },
  ];
  const max = Math.max(1, ...Object.values<number>(data.byStatus));
  const pct = Math.max(0, Math.min(100, data.profilePercent ?? 0));
  const R = 38, C = 2 * Math.PI * R;
  const pill = (d: number | null, rolling?: boolean) => {
    if (rolling) return { text: c('card.rolling'), cls: 'bg-accent text-primary' };
    if (d === null) return { text: '', cls: '' };
    if (d < 0) return { text: c('card.expired'), cls: 'bg-slate-100 text-muted' };
    return { text: c('card.daysLeft', { n: d }), cls: d <= 7 ? 'bg-red-50 text-red-600' : d <= 30 ? 'bg-amber-50 text-amber-700' : 'bg-accent text-primary' };
  };
  return (
    <div className="space-y-6">
      {/* Salomlashuv banneri */}
      <section className="relative isolate overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-accent via-white to-accent/60 p-6 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 -z-10 h-56 w-56 rounded-full bg-primary/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 right-24 -z-10 h-40 w-40 rounded-full bg-primary/5" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/campus.jpg" alt="" className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden h-full w-1/3 object-cover opacity-90 md:block" style={{ maskImage: 'linear-gradient(to right, transparent, #000 45%)', WebkitMaskImage: 'linear-gradient(to right, transparent, #000 45%)' }} />
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">{t('hello', { name: user?.firstName ?? '' })} <span aria-hidden>👋</span></h1>
        <p className="mt-2 max-w-md text-sm text-muted sm:text-base">{L("O'zingizga mos grantlar va dasturlarni kashf eting.", 'Находите гранты и программы, подходящие именно вам.', 'Discover grants and programs that fit you.')}</p>
        <Link href="/scholarships" className="btn btn-primary mt-5 inline-flex">{L("Yangi grantlarni ko'rish", 'Смотреть новые гранты', 'Browse new grants')} <Icon name="arrow" className="h-4 w-4" /></Link>
      </section>

      {/* Statistika */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((x) => (
          <Link key={x.k} href={x.href} className="card relative p-4 transition hover:-translate-y-0.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-primary"><Icon name={x.icon} className="h-5 w-5" /></span>
            {x.k === 'unread' && x.n > 0 && <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-red-500" />}
            <p className="mt-3 font-head text-3xl font-extrabold text-navy">{x.n}</p>
            <p className="text-sm text-muted">{x.label ?? t(x.k)}</p>
          </Link>
        ))}
      </div>

      {/* Tavsiya etilgan grantlar */}
      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-navy">{L('Sizga tavsiya etilgan grantlar', 'Рекомендованные вам гранты', 'Grants recommended for you')}</h2><Link href="/app/recommended" className="text-sm font-semibold text-primary">{L('Barchasini ko‘rish', 'Смотреть все', 'See all')} →</Link></div>
        {rec.loading && !rec.data ? <Spinner /> : !rec.data?.length ? (
          <Link href="/app/profile" className="card block p-5 text-sm text-muted">{L("Tavsiyalar chiqishi uchun profilingizni to'ldiring.", 'Заполните профиль, чтобы появились рекомендации.', 'Complete your profile to get recommendations.')}</Link>
        ) : (
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
            {rec.data.slice(0, 3).map((s: any) => {
              const d = daysLeft(s.deadline); const p = pill(d, s.rolling);
              return (
                <Link key={s.id} href={`/scholarships/${s.slug}`} className="card flex min-w-[78%] snap-start flex-col gap-3 p-4 transition hover:-translate-y-0.5 sm:min-w-0">
                  <div className="flex items-center gap-3"><Flag code={s.countryCode} className="h-8 w-12 shrink-0 rounded" /><div className="min-w-0"><p className="truncate font-bold text-navy">{s.tr?.title ?? s.slug}</p><p className="truncate text-xs text-muted">{s.organization} · {countryName(s.country, locale)}</p></div></div>
                  <div className="flex flex-wrap gap-1.5">{(s.levels ?? []).slice(0, 3).map((l: string) => <span key={l} className="chip">{c(`level.${l}`)}</span>)}<span className="chip">{c(`funding.${s.funding}`)}</span></div>
                  {p.text && <span className={`mt-auto w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${p.cls}`}>{p.text}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Yaqin muddatlar */}
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-navy">{L('Mening yaqin muddatlarim', 'Мои ближайшие сроки', 'My upcoming deadlines')}</h2><Link href="/app/calendar" className="text-sm font-semibold text-primary">{L('Barchasi', 'Все', 'All')} →</Link></div>
          {data.upcoming.length === 0 ? <p className="text-sm text-muted">{t('noUpcoming')}</p> : (
            <ul className="divide-y divide-navy/10">
              {data.upcoming.slice(0, 5).map((s: any) => {
                const d = daysLeft(s.deadline); const p = pill(d, s.rolling);
                return (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <Flag code={s.countryCode} className="h-6 w-9 shrink-0 rounded" />
                    <div className="min-w-0 flex-1"><Link href={`/scholarships/${s.slug}`} className="block truncate font-semibold text-navy hover:text-primary">{s.tr?.title ?? s.slug}</Link><p className="truncate text-xs text-muted">{L('Ariza topshirish muddati', 'Срок подачи заявки', 'Application deadline')}</p></div>
                    {p.text && <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${p.cls}`}>{p.text}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Profil to'liqligi */}
        <section className="card flex flex-col items-center gap-3 p-5 text-center">
          <h2 className="self-start text-lg font-bold text-navy">{L("Profil to'ldirilganligi", 'Заполненность профиля', 'Profile completeness')}</h2>
          <div className="relative h-28 w-28">
            <svg viewBox="0 0 100 100" className="-rotate-90" role="img" aria-label={`${pct}%`}><circle cx="50" cy="50" r={R} fill="none" stroke="#E5E7EB" strokeWidth="10" /><circle cx="50" cy="50" r={R} fill="none" stroke="#087F5B" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} /></svg>
            <span className="absolute inset-0 grid place-items-center font-head text-2xl font-extrabold text-navy">{pct}%</span>
          </div>
          <p className="text-sm text-muted">{t('fill')}</p>
          <Link href="/app/profile" className="btn btn-primary w-full">{L('Davom etish', 'Продолжить', 'Continue')} →</Link>
        </section>
      </div>

      {Object.keys(data.byStatus).length > 0 && (
        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold text-navy">{t('pipeline')}</h2>
          {Object.entries<number>(data.byStatus).map(([k, v]) => <Bar key={k} label={st(k)} value={v} max={max} />)}
        </section>
      )}
    </div>
  );
}
