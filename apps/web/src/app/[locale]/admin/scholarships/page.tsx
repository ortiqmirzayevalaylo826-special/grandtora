'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { api, useQuery } from '@/lib/client';
import { Empty, ErrorBox, Notice, PageHead, Spinner, useErr } from '@/components/ui';

const STATUSES = ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'EXPIRED', 'ARCHIVED'];
// holat → [tugma kaliti, yangi holat]
const ACTIONS: Record<string, [string, string][]> = {
  DRAFT: [['toPending', 'PENDING'], ['publish', 'PUBLISHED'], ['archive', 'ARCHIVED']],
  PENDING: [['publish', 'PUBLISHED'], ['reject', 'REJECTED'], ['toDraft', 'DRAFT']],
  PUBLISHED: [['archive', 'ARCHIVED'], ['toDraft', 'DRAFT']],
  REJECTED: [['toDraft', 'DRAFT'], ['toPending', 'PENDING']],
  EXPIRED: [['republish', 'PUBLISHED'], ['archive', 'ARCHIVED']],
  ARCHIVED: [['toDraft', 'DRAFT']],
};
const BADGE: Record<string, string> = { PUBLISHED: 'bg-accent text-primary-600', PENDING: 'bg-amber-100 text-amber-800', DRAFT: 'bg-navy/5 text-navy', REJECTED: 'bg-red-50 text-red-700', EXPIRED: 'bg-red-50 text-red-700', ARCHIVED: 'bg-navy/5 text-muted' };

export default function AdminScholarships() {
  const t = useTranslations('ad');
  const sh = useTranslations('shell');
  const st = useTranslations('sstatus');
  const c = useTranslations('common');
  const err = useErr();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');
  const qs = new URLSearchParams(); if (status) qs.set('status', status); if (applied) qs.set('q', applied);
  const { data, error, loading, reload } = useQuery<any[]>(`/admin/scholarships?${qs}`);
  const [msg, setMsg] = useState('');

  async function setS(id: string, s: string) {
    setMsg('');
    try { await api(`/admin/scholarships/${id}/status`, { method: 'PATCH', body: { status: s } }); reload(); } catch (x: any) { setMsg(err(x.code)); }
  }
  async function del(id: string) {
    if (!confirm(c('confirm'))) return;
    try { await api(`/admin/scholarships/${id}`, { method: 'DELETE' }); reload(); } catch (x: any) { setMsg(err(x.code)); }
  }

  return (
    <div>
      <PageHead title={sh('a_sch')}><Link href="/admin/scholarships/new" className="btn btn-primary">+ {t('new')}</Link></PageHead>
      <form className="mb-4 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); setApplied(q.trim()); }}>
        <input className="input max-w-xs" placeholder={t('q')} aria-label={t('q')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={c('status')}><option value="">{c('all')}</option>{STATUSES.map((s) => <option key={s} value={s}>{st(s)}</option>)}</select>
        <button className="btn btn-ghost">{c('search')}</button>
      </form>
      {msg && <div className="mb-3"><Notice kind="err">{msg}</Notice></div>}
      {loading ? <Spinner /> : error || !data ? <ErrorBox code={error ?? 'generic'} onRetry={reload} /> : data.length === 0 ? <Empty text={c('none')} /> : (
        <ul className="space-y-3">
          {data.map((s) => {
            const title = (s.translations.find((x: any) => x.locale === 'en') ?? s.translations[0])?.title ?? s.slug;
            return (
              <li key={s.id} className="card flex flex-col gap-3 p-4 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><b className="truncate text-navy">{title}</b><span className={`chip ${BADGE[s.status]}`}>{st(s.status)}</span>{s.isDemo && <span className="chip bg-amber-100 !text-amber-800">{t('demo')}</span>}</div>
                  <p className="mt-0.5 truncate text-sm text-muted">{s.organization} · {s.countryCode} · {s.rolling ? t('rolling') : s.deadline ? new Date(s.deadline).toLocaleDateString() : '—'} · 👁 {s.views}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ACTIONS[s.status].map(([k, to]) => <button key={k} className={`btn h-9 px-3 text-xs ${to === 'PUBLISHED' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setS(s.id, to)}>{t(k)}</button>)}
                  <Link href={`/admin/scholarships/${s.id}`} className="btn btn-ghost h-9 px-3 text-xs">{c('edit')}</Link>
                  <button className="btn btn-ghost h-9 px-3 text-xs text-red-700" onClick={() => del(s.id)}>{c('delete')}</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
