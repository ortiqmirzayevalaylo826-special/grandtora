'use client';
import { useTranslations } from 'next-intl';
import { api, useQuery } from '@/lib/client';
import { Empty, ErrorBox, PageHead, Spinner } from '@/components/ui';

export default function AdminReviews() {
  const t = useTranslations('ad');
  const sh = useTranslations('shell');
  const { data, error, loading, reload } = useQuery<any[]>('/admin/reviews');
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  const act = async (id: string, status: 'APPROVED' | 'REJECTED') => { await api(`/admin/reviews/${id}`, { method: 'PATCH', body: { status } }); reload(); };
  return (
    <div>
      <PageHead title={sh('a_reviews')} />
      {data.length === 0 ? <Empty text={t('noReviews')} /> : (
        <ul className="space-y-3">
          {data.map((r) => (
            <li key={r.id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm"><b className="text-amber-500">{'★'.repeat(r.stars)}</b> <b className="text-navy">{r.scholarship.slug}</b> · <span className="text-muted">{r.user.firstName} {r.user.lastName} ({r.user.email})</span></p>
                <p className="mt-1 text-sm">{r.text}</p>
              </div>
              <button className="btn btn-primary h-9 px-3 text-xs" onClick={() => act(r.id, 'APPROVED')}>{t('approve')}</button>
              <button className="btn btn-ghost h-9 px-3 text-xs text-red-700" onClick={() => act(r.id, 'REJECTED')}>{t('reject')}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
