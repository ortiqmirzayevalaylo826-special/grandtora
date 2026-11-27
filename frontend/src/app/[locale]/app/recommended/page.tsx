'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { api, useQuery } from '@/lib/client';
import { Empty, ErrorBox, PageHead, Spinner } from '@/components/ui';
import GrantItem from '@/components/console/GrantItem';

export default function Recommended() {
  const t = useTranslations('rec');
  const locale = useLocale();
  const { data, error, loading, reload } = useQuery<any[]>(`/me/recommended?locale=${locale}`);
  const ids = useQuery<{ saved: string[] }>('/me/ids');
  const [local, setLocal] = useState<Record<string, boolean>>({});
  const isSaved = (id: string) => local[id] ?? ids.data?.saved.includes(id) ?? false;
  async function toggle(id: string) {
    const next = !isSaved(id);
    setLocal((x) => ({ ...x, [id]: next }));
    try { await api(`/me/saved/${id}`, { method: next ? 'PUT' : 'DELETE' }); } catch { setLocal((x) => ({ ...x, [id]: !next })); }
  }
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  return (
    <div>
      <PageHead title={t('title')} />
      <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t('disclaimer')}</p>
      {data.length === 0 ? <Empty text={t('empty')} /> : (
        <div className="space-y-3">
          {data.map((s) => (
            <GrantItem key={s.id} s={s}
              aside={
                <div className="mt-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-28 rounded-full bg-navy/5"><div className="h-2 rounded-full bg-primary" style={{ width: `${s.match.percent}%` }} /></div>
                    <b className="text-sm text-primary">{t('match', { n: s.match.percent })}</b>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.match.checks.map((c: any) => (
                      <span key={c.key} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c.ok ? 'bg-accent text-primary-600' : 'bg-red-50 text-red-700'}`}>{c.ok ? '✓' : '✗'} {t(c.key)}</span>
                    ))}
                  </div>
                </div>
              }>
              <button className={`btn h-9 px-3 text-xs ${isSaved(s.id) ? 'btn-primary' : 'btn-ghost'}`} onClick={() => toggle(s.id)} aria-pressed={isSaved(s.id)}>♥</button>
              <Link href={`/app/grants/${s.slug}`} className="btn btn-ghost h-9 px-3 text-xs">→</Link>
            </GrantItem>
          ))}
        </div>
      )}
    </div>
  );
}
