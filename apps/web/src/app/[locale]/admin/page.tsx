'use client';
import { useTranslations } from 'next-intl';
import { useQuery } from '@/lib/client';
import { Bar, ErrorBox, PageHead, Spinner } from '@/components/ui';

export default function AdminHome() {
  const t = useTranslations('ad');
  const st = useTranslations('status');
  const { data, error, loading, reload } = useQuery<any>('/admin/stats');
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  const cards = [['students', data.users], ['published', data.published], ['expiring', data.expiring], ['apps', data.apps]];
  const maxS = Math.max(1, ...data.byStatus.map((x: any) => x._count));
  const maxC = Math.max(1, ...data.byCountry.map((x: any) => x._count));
  return (
    <div className="space-y-6">
      <PageHead title={t('title')}><a className="btn btn-ghost" href="/api/admin/export/scholarships.csv">{t('export')}</a></PageHead>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([k, n]) => <div key={k as string} className="card p-4"><p className="font-head text-3xl font-extrabold text-navy">{n as number}</p><p className="text-sm text-muted">{t(k as string)}</p></div>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-3 p-5"><h2 className="text-lg font-bold">{t('byStatus')}</h2>{data.byStatus.length ? data.byStatus.map((x: any) => <Bar key={x.status} label={st(x.status)} value={x._count} max={maxS} />) : <p className="text-sm text-muted">—</p>}</section>
        <section className="card space-y-3 p-5"><h2 className="text-lg font-bold">{t('byCountry')}</h2>{data.byCountry.length ? data.byCountry.map((x: any) => <Bar key={x.countryCode} label={x.countryCode} value={x._count} max={maxC} />) : <p className="text-sm text-muted">—</p>}</section>
      </div>
    </div>
  );
}
