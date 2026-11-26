'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { api, useQuery } from '@/lib/client';
import { Empty, ErrorBox, PageHead, Spinner } from '@/components/ui';

export default function Freshness() {
  const t = useTranslations('ad');
  const sh = useTranslations('shell');
  const { data, error, loading, reload } = useQuery<any[]>('/admin/freshness');
  const [sel, setSel] = useState<string[]>([]);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  const toggle = (id: string) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  return (
    <div>
      <PageHead title={sh('a_fresh')}>{data.length > 0 && <button className="btn btn-primary" disabled={!sel.length} onClick={async () => { await api('/admin/freshness/verify', { body: { ids: sel } }); setSel([]); reload(); }}>{t('verifySel')} ({sel.length})</button>}</PageHead>
      <p className="mb-4 text-sm text-muted">{t('staleHint')}</p>
      {data.length === 0 ? <Empty text={t('allFresh')} /> : (
        <ul className="space-y-2">
          {data.map((s) => (
            <li key={s.id} className="card flex items-center gap-3 p-4">
              <input type="checkbox" className="h-5 w-5" checked={sel.includes(s.id)} onChange={() => toggle(s.id)} aria-label={s.slug} />
              <div className="min-w-0 flex-1"><Link href={`/admin/scholarships/${s.id}`} className="font-bold text-navy hover:text-primary">{s.translations[0]?.title ?? s.slug}</Link><p className="text-xs text-muted">{s.organization} · {s.lastVerifiedAt ? new Date(s.lastVerifiedAt).toLocaleDateString() : t('never')}</p></div>
              <a href={s.officialUrl} target="_blank" rel="noopener noreferrer nofollow" className="btn btn-ghost h-9 px-3 text-xs">↗</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
