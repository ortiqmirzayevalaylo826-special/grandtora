'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, useQuery } from '@/lib/client';
import { Empty, ErrorBox, Notice, PageHead, Spinner, useErr } from '@/components/ui';

export default function AdminUsers() {
  const t = useTranslations('ad');
  const c = useTranslations('common');
  const err = useErr();
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');
  const { data, error, loading, reload } = useQuery<any[]>(`/admin/users${applied ? `?q=${encodeURIComponent(applied)}` : ''}`);
  const [msg, setMsg] = useState('');
  async function block(id: string, blocked: boolean) {
    setMsg('');
    try { await api(`/admin/users/${id}/block`, { method: 'PATCH', body: { blocked } }); reload(); } catch (x: any) { setMsg(err(x.code)); }
  }
  return (
    <div>
      <PageHead title={t('students')} />
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); setApplied(q.trim()); }}>
        <input className="input max-w-xs" placeholder={t('email')} aria-label={t('email')} value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn btn-ghost">{c('search')}</button>
      </form>
      {msg && <div className="mb-3"><Notice kind="err">{msg}</Notice></div>}
      {loading ? <Spinner /> : error || !data ? <ErrorBox code={error ?? 'generic'} onRetry={reload} /> : data.length === 0 ? <Empty text={c('none')} /> : (
        <ul className="space-y-2">
          {data.map((u) => (
            <li key={u.id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <b className="text-navy">{u.firstName} {u.lastName}</b> {u.blockedAt && <span className="chip bg-red-50 !text-red-700">{t('blocked')}</span>}
                <p className="truncate text-sm text-muted">{u.email} · {u.emailVerifiedAt ? t('verified') : t('unverified')} · {new Date(u.createdAt).toLocaleDateString()}</p>
              </div>
              <button className="btn btn-ghost h-9 px-3 text-xs" onClick={() => block(u.id, !u.blockedAt)}>{u.blockedAt ? t('unblock') : t('block')}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
