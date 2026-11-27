'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { api, useQuery } from '@/lib/client';
import { Empty, ErrorBox, PageHead, Spinner } from '@/components/ui';
import GrantItem from '@/components/console/GrantItem';

export default function Saved() {
  const t = useTranslations('sv');
  const locale = useLocale();
  const { data, error, loading, reload, setData } = useQuery<any[]>(`/me/saved?locale=${locale}`);
  const [tracked, setTracked] = useState<Record<string, boolean>>({});
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  return (
    <div>
      <PageHead title={t('title')} />
      {data.length === 0 ? <Empty text={t('empty')} /> : (
        <div className="space-y-3">
          {data.map((s) => (
            <GrantItem key={s.id} s={s}>
              <button className="btn btn-ghost h-9 px-3 text-xs" disabled={tracked[s.id]} onClick={async () => { await api(`/me/applications/${s.id}`, { method: 'PUT' }); setTracked((x) => ({ ...x, [s.id]: true })); }}>
                {tracked[s.id] ? '✓' : t('track')}
              </button>
              <button className="btn btn-ghost h-9 px-3 text-xs" onClick={async () => { await api(`/me/saved/${s.id}`, { method: 'DELETE' }); setData(data.filter((x) => x.id !== s.id)); }}>{t('remove')}</button>
              <Link href={`/app/grants/${s.slug}`} className="btn btn-primary h-9 px-3 text-xs">→</Link>
            </GrantItem>
          ))}
        </div>
      )}
    </div>
  );
}
