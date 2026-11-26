'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { api, useQuery } from '@/lib/client';
import { Empty, ErrorBox, PageHead, Spinner } from '@/components/ui';

export default function AdminReports() {
  const t = useTranslations('ad');
  const sh = useTranslations('shell');
  const { data, error, loading, reload } = useQuery<any[]>('/admin/reports');
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  return (
    <div>
      <PageHead title={sh('a_reports')} />
      {data.length === 0 ? <Empty text={t('noReports')} /> : (
        <ul className="space-y-3">
          {data.map((r) => (
            <li key={r.id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1"><Link href={`/scholarships/${r.scholarship.slug}`} className="font-bold text-primary">{r.scholarship.slug}</Link><p className="mt-1 text-sm">{r.text}</p><p className="mt-1 text-xs text-muted">{new Date(r.createdAt).toLocaleString()}</p></div>
              <button className="btn btn-primary h-9 px-3 text-xs" onClick={async () => { await api(`/admin/reports/${r.id}/resolve`, { method: 'PATCH', body: {} }); reload(); }}>{t('resolve')}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
