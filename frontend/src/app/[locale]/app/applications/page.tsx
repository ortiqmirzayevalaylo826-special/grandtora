'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api, useQuery } from '@/lib/client';
import { Empty, ErrorBox, PageHead, Spinner, useErr } from '@/components/ui';
import GrantItem from '@/components/console/GrantItem';

const STATUSES = ['INTERESTED', 'PREPARING', 'SUBMITTED', 'REVIEW', 'INTERVIEW', 'ACCEPTED', 'REJECTED'];

function Card({ a, onRemove }: { a: any; onRemove: () => void }) {
  const t = useTranslations('ap');
  const st = useTranslations('status');
  const c = useTranslations('common');
  const err = useErr();
  const docs: string[] = a.scholarship.tr?.documents ?? [];
  const [status, setStatus] = useState<string>(a.status);
  const [note, setNote] = useState<string>(a.note ?? '');
  const [list, setList] = useState<boolean[]>(Array.from({ length: docs.length }, (_, i) => !!a.checklist?.[i]));
  const [msg, setMsg] = useState('');
  const patch = async (body: object) => {
    try { await api(`/me/applications/${a.scholarshipId}`, { method: 'PATCH', body }); setMsg(c('saved')); setTimeout(() => setMsg(''), 1500); }
    catch (e: any) { setMsg(err(e.code)); }
  };
  const done = list.filter(Boolean).length;
  return (
    <GrantItem s={a.scholarship}
      aside={
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <select className="input h-9 w-auto text-xs" value={status} aria-label={c('status')} onChange={(e) => { setStatus(e.target.value); patch({ status: e.target.value }); }}>
              {STATUSES.map((s) => <option key={s} value={s}>{st(s)}</option>)}
            </select>
            {docs.length > 0 && <span className="text-xs font-semibold text-muted">{t('done', { a: done, b: docs.length })}</span>}
            {msg && <span role="status" className="text-xs font-semibold text-primary">{msg}</span>}
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-navy">{t('checklist')}</p>
            {docs.length === 0 ? <p className="text-xs text-muted">{t('noList')}</p> : docs.map((d, i) => (
              <label key={d} className="flex items-center gap-2 py-0.5 text-sm">
                <input type="checkbox" checked={list[i]} onChange={() => { const n = list.map((v, j) => (j === i ? !v : v)); setList(n); patch({ checklist: n }); }} />
                <span className={list[i] ? 'text-muted line-through' : ''}>{d}</span>
              </label>
            ))}
          </div>
          <textarea className="input h-20 py-2" placeholder={t('note')} aria-label={t('note')} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (a.note ?? '') && patch({ note })} />
        </div>
      }>
      <button className="btn btn-ghost h-9 px-3 text-xs" onClick={async () => { if (confirm(c('confirm'))) { await api(`/me/applications/${a.scholarshipId}`, { method: 'DELETE' }); onRemove(); } }}>{t('untrack')}</button>
    </GrantItem>
  );
}

export default function Applications() {
  const t = useTranslations('ap');
  const locale = useLocale();
  const { data, error, loading, reload, setData } = useQuery<any[]>(`/me/applications?locale=${locale}`);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  return (
    <div>
      <PageHead title={t('title')} />
      {data.length === 0 ? <Empty text={t('empty')} /> : <div className="space-y-3">{data.map((a) => <Card key={a.id} a={a} onRemove={() => setData(data.filter((x) => x.id !== a.id))} />)}</div>}
    </div>
  );
}
