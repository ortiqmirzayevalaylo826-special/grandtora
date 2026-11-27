'use client';
import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useQuery } from '@/lib/client';
import { Empty, ErrorBox, PageHead, Spinner } from '@/components/ui';

const WD = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const key = (d: Date) => d.toISOString().slice(0, 10);
const icsEsc = (s: string) => s.replace(/[\;,]/g, (m) => '\\' + m).replace(/\n/g, ' ');

export default function CalendarPage() {
  const t = useTranslations('cal');
  const locale = useLocale();
  const saved = useQuery<any[]>(`/me/saved?locale=${locale}`);
  const apps = useQuery<any[]>(`/me/applications?locale=${locale}`);
  const [cur, setCur] = useState(() => { const n = new Date(); return new Date(Date.UTC(n.getFullYear(), n.getMonth(), 1)); });

  const items = useMemo(() => {
    const map = new Map<string, any>();
    [...(saved.data ?? []), ...(apps.data ?? []).map((a) => a.scholarship)].forEach((s) => { if (s.deadline) map.set(s.id, s); });
    return [...map.values()].sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [saved.data, apps.data]);

  if (saved.loading || apps.loading) return <Spinner />;
  if (saved.error || apps.error) return <ErrorBox code={(saved.error ?? apps.error)!} onRetry={() => { saved.reload(); apps.reload(); }} />;

  const y = cur.getUTCFullYear(), m = cur.getUTCMonth();
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const offset = (cur.getUTCDay() + 6) % 7;
  const byDay = new Map<string, any[]>();
  items.forEach((s) => { const k = s.deadline.slice(0, 10); byDay.set(k, [...(byDay.get(k) ?? []), s]); });
  const monthItems = items.filter((s) => s.deadline.startsWith(`${y}-${String(m + 1).padStart(2, '0')}`));
  const todayKey = key(new Date());

  function downloadIcs() {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Grantora//EN'];
    items.forEach((s) => {
      const d = s.deadline.slice(0, 10).replace(/-/g, '');
      lines.push('BEGIN:VEVENT', `UID:${s.id}@grantora`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${icsEsc(`Deadline: ${s.tr?.title ?? s.slug}`)}`, `URL:${s.officialUrl}`, 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
    const a = document.createElement('a'); a.href = url; a.download = 'grantora-deadlines.ics'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHead title={t('title')}>{items.length > 0 && <button className="btn btn-ghost" onClick={downloadIcs}>{t('ics')}</button>}</PageHead>
      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <button className="btn btn-ghost h-9 px-3" onClick={() => setCur(new Date(Date.UTC(y, m - 1, 1)))} aria-label="prev">‹</button>
          <b className="font-head text-lg capitalize text-navy">{cur.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })}</b>
          <button className="btn btn-ghost h-9 px-3" onClick={() => setCur(new Date(Date.UTC(y, m + 1, 1)))} aria-label="next">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted">{WD.map((w) => <span key={w}>{t(w)}</span>)}</div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: offset }, (_, i) => <span key={`e${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
            const has = byDay.get(k);
            return (
              <div key={k} title={has?.map((s) => s.tr?.title).join(', ')}
                className={`grid h-11 place-items-center rounded-lg text-sm ${has ? 'bg-primary font-bold text-white' : k === todayKey ? 'border border-primary text-primary' : 'text-navy/80'}`}>{i + 1}</div>
            );
          })}
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {monthItems.length === 0 ? <Empty text={t('empty')} /> : monthItems.map((s) => (
          <Link key={s.id} href={`/app/grants/${s.slug}`} className="card flex items-center gap-3 p-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent font-head text-lg font-extrabold text-primary-600">{Number(s.deadline.slice(8, 10))}</span>
            <span className="min-w-0"><b className="block truncate text-navy">{s.tr?.title ?? s.slug}</b><span className="text-xs text-muted">{s.organization}</span></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
