'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@/lib/client';
import { Empty, ErrorBox, PageHead, Spinner } from '@/components/ui';

export default function Audit() {
  const t = useTranslations('ad');
  const sh = useTranslations('shell');
  const locale = useLocale();
  const { data, error, loading, reload } = useQuery<any[]>('/admin/audit');
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  return (
    <div>
      <PageHead title={sh('a_audit')} />
      {data.length === 0 ? <Empty text="—" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-navy/10 text-xs uppercase text-muted"><tr><th className="p-3">{t('when')}</th><th className="p-3">{t('what')}</th><th className="p-3">{t('target')}</th><th className="p-3">IP</th></tr></thead>
            <tbody>{data.map((a) => (
              <tr key={a.id} className="border-b border-navy/5 last:border-0"><td className="p-3 text-muted">{new Date(a.createdAt).toLocaleString(locale)}</td><td className="p-3 font-semibold text-navy">{a.action}</td><td className="p-3">{a.entity}{a.meta?.slug ? ` · ${a.meta.slug}` : ''}</td><td className="p-3 text-muted">{a.ip ?? ''}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
