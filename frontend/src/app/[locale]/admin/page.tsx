'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useQuery } from '@/lib/client';
import Flag from '@/components/Flag';
import { Donut, EmptyState, ErrorState, LineChart, PageTitle, Panel, Skeleton, StatCard, useDateFmt, useL } from '@/components/admin/kit';

interface Dash {
  days: number; cards: { total: number; active: number; users: number; todayReg: number; pending: number; newTickets: number; blocked: number };
  registrations: { day: string; n: number }[]; views: { day: string; n: number }[]; viewsTotal: number;
  byCountry: { code: string; nameUz: string; nameRu: string; nameEn: string; n: number }[]; byLevel: { level: string; n: number }[];
  recent: { id: string; action: string; entity: string; createdAt: string; actor: string | null; meta: any }[];
  newGrants: { id: string; slug: string; title: string; organization: string; countryCode: string; createdAt: string }[];
  popular: { id: string; slug: string; title: string; organization: string; countryCode: string; views: number }[];
}
const COLORS = ['#087F5B', '#102A43', '#38bdf8', '#f59e0b', '#a78bfa'];

export default function AdminDashboard() {
  const L = useL();
  const f = useDateFmt();
  const locale = useLocale();
  const lv = useTranslations('level');
  const [days, setDays] = useState(30);
  const { data, error, loading, reload } = useQuery<Dash>(`/admin/panel/dashboard?days=${days}`);
  const cName = (c: Dash['byCountry'][number]) => (locale === 'ru' ? c.nameRu : locale === 'en' ? c.nameEn : c.nameUz);
  const maxC = Math.max(1, ...(data?.byCountry.map((c) => c.n) ?? [1]));
  const totalLvl = data?.byLevel.reduce((a, x) => a + x.n, 0) ?? 0;
  const regTotal = data?.registrations.reduce((a, x) => a + x.n, 0) ?? 0;

  return (
    <div>
      <PageTitle title={L('Statistika', 'Статистика', 'Statistics')} sub={L("Barcha raqamlar bazadan real vaqtda olinadi", 'Все цифры берутся из базы в реальном времени', 'All numbers come live from the database')}>
        <select className="input !w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label={L('Davr', 'Период', 'Period')}>
          {[7, 30, 90].map((d) => <option key={d} value={d}>{L(`So'nggi ${d} kun`, `Последние ${d} дн.`, `Last ${d} days`)}</option>)}
        </select>
      </PageTitle>

      {error ? <ErrorState onRetry={reload} /> : !data ? <Skeleton rows={6} /> : (
        <div className={`space-y-5 ${loading ? 'opacity-70 transition' : ''}`}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <StatCard icon="list" label={L('Jami grantlar', 'Всего грантов', 'Total grants')} value={data.cards.total} />
            <StatCard icon="check" label={L('Faol grantlar', 'Активные гранты', 'Active grants')} value={data.cards.active} />
            <StatCard icon="users" label={L('Foydalanuvchilar', 'Пользователи', 'Users')} value={data.cards.users} tone="bg-sky-50 text-sky-700" />
            <StatCard icon="user" label={L("Bugun ro'yxatdan o'tgan", 'Регистрации сегодня', 'Signed up today')} value={data.cards.todayReg} tone="bg-violet-50 text-violet-700" />
            <StatCard icon="clock" label={L('Tekshiruv kutilmoqda', 'Ожидают проверки', 'Pending review')} value={data.cards.pending} tone="bg-amber-50 text-amber-700" />
            <StatCard icon="inbox" label={L('Yangi murojaatlar', 'Новые обращения', 'New inquiries')} value={data.cards.newTickets} tone="bg-orange-50 text-orange-700" />
            <StatCard icon="ban" label={L('Bloklanganlar', 'Заблокированные', 'Blocked users')} value={data.cards.blocked} tone="bg-red-50 text-red-700" />
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            <Panel className="lg:col-span-3" title={L("Foydalanuvchilar o'sishi", 'Рост пользователей', 'User growth')} action={<span className="text-xs text-muted">{L('Yangi', 'Новых', 'New')}: <b className="text-navy">{regTotal}</b></span>}>
              <LineChart data={data.registrations} label={L("Ro'yxatdan o'tishlar", 'Регистрации', 'Sign-ups')} />
            </Panel>
            <Panel className="lg:col-span-2" title={L("Ta'lim bosqichlari bo'yicha grantlar", 'Гранты по уровням', 'Grants by level')}>
              {totalLvl === 0 ? <EmptyState text={L("Nashr etilgan grant yo'q", 'Нет опубликованных грантов', 'No published grants')} /> : (
                <Donut center={totalLvl} sub={L('daraja yozuvi', 'записей', 'entries')} parts={data.byLevel.map((x, i) => ({ label: lv(x.level), n: x.n, color: COLORS[i % COLORS.length] }))} />
              )}
            </Panel>
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            <Panel className="lg:col-span-3" title={L("Grantlar ko'rilishi", 'Просмотры грантов', 'Grant views')} action={<span className="text-xs text-muted">{L('Jami', 'Всего', 'Total')}: <b className="text-navy">{data.viewsTotal}</b></span>}>
              <LineChart data={data.views} color="#102A43" label={L("Ko'rilishlar", 'Просмотры', 'Views')} />
            </Panel>
            <Panel className="lg:col-span-2" title={L("Grantlar davlatlar bo'yicha", 'Гранты по странам', 'Grants by country')}>
              {data.byCountry.length === 0 ? <EmptyState text={L("Ma'lumot yo'q", 'Нет данных', 'No data')} /> : (
                <ul className="space-y-3">
                  {data.byCountry.map((c) => (
                    <li key={c.code}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm"><span className="flex min-w-0 items-center gap-2"><Flag code={c.code} className="h-4 w-6" /><span className="truncate">{cName(c)}</span></span><b>{c.n}</b></div>
                      <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-primary" style={{ width: `${(c.n / maxC) * 100}%` }} /></div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <Panel title={L("Oxirgi faoliyatlar", 'Последние действия', 'Recent activity')} action={<Link href="/admin/audit" className="text-xs font-semibold text-primary">{L('Hammasi', 'Все', 'All')} →</Link>}>
              {data.recent.length === 0 ? <EmptyState text={L("Faoliyat yo'q", 'Нет действий', 'No activity')} icon="log" /> : (
                <ul className="space-y-3">{data.recent.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" /><div className="min-w-0"><p className="truncate font-semibold">{r.action} · {r.entity}</p><p className="truncate text-xs text-muted">{r.actor ?? '—'} · {f.ago(r.createdAt)}</p></div></li>
                ))}</ul>
              )}
            </Panel>
            <Panel title={L('Yangi grantlar', 'Новые гранты', 'New grants')} action={<Link href="/admin/scholarships" className="text-xs font-semibold text-primary">{L('Hammasi', 'Все', 'All')} →</Link>}>
              {data.newGrants.length === 0 ? <EmptyState text={L("Grant yo'q", 'Нет грантов', 'No grants')} /> : (
                <ul className="space-y-3">{data.newGrants.map((g) => (
                  <li key={g.id} className="flex items-center gap-3"><Flag code={g.countryCode} className="h-5 w-7" /><div className="min-w-0 flex-1"><Link href={`/admin/scholarships/${g.id}`} className="block truncate text-sm font-semibold hover:text-primary">{g.title}</Link><p className="truncate text-xs text-muted">{g.organization} · {f.date(g.createdAt)}</p></div></li>
                ))}</ul>
              )}
            </Panel>
            <Panel title={L('Eng mashhur grantlar', 'Самые популярные гранты', 'Most popular grants')}>
              {data.popular.length === 0 ? <EmptyState text={L("Ma'lumot yo'q", 'Нет данных', 'No data')} /> : (
                <ul className="space-y-3">{data.popular.map((g, i) => (
                  <li key={g.id} className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent text-xs font-bold text-primary">{i + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{g.title}</p><p className="truncate text-xs text-muted">{g.organization}</p></div><span className="text-xs font-semibold text-navy">{g.views}</span></li>
                ))}</ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
