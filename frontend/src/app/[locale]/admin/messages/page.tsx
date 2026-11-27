'use client';
import { useTranslations } from 'next-intl';
import { api, useQuery } from '@/lib/client';
import { Empty, ErrorBox, PageHead, Spinner } from '@/components/ui';

interface Msg { id: string; name: string; email: string; subject: string; message: string; locale: string; status: 'OPEN' | 'RESOLVED'; createdAt: string }

export default function AdminMessages() {
  const t = useTranslations('ad');
  const { data, error, loading, reload } = useQuery<{ items: Msg[]; open: number }>('/admin/messages');
  const subs = useQuery<{ items: { id: string; email: string }[]; total: number }>('/admin/subscribers');
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  const set = async (id: string, status: 'OPEN' | 'RESOLVED') => { await api(`/admin/messages/${id}`, { method: 'PATCH', body: { status } }); reload(); };
  return (
    <div>
      <PageHead title={t('msgTitle')} />
      <p className="mb-4 text-sm text-muted">{t('msgOpen')}: <b>{data.open}</b> · {t('subs')}: <b>{subs.data?.total ?? '—'}</b></p>
      {data.items.length === 0 ? <Empty text={t('msgNone')} /> : (
        <ul className="space-y-3">
          {data.items.map((m) => (
            <li key={m.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm"><span className="text-muted">{t('msgFrom')}:</span> <b>{m.name}</b> · <a className="text-primary" href={`mailto:${m.email}`}>{m.email}</a></p>
                <span className={`chip ${m.status === 'OPEN' ? '' : 'bg-navy/5 !text-navy'}`}>{m.status}</span>
              </div>
              <p className="mt-2 text-sm font-semibold">{m.subject}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink/85">{m.message}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted">{new Date(m.createdAt).toLocaleString()} · {m.locale}</span>
                <button className="btn btn-ghost h-9 px-3 text-xs" onClick={() => set(m.id, m.status === 'OPEN' ? 'RESOLVED' : 'OPEN')}>{m.status === 'OPEN' ? t('msgResolve') : t('msgReopen')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
