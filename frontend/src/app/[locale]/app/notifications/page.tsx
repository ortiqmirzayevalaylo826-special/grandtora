'use client';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { api, useQuery } from '@/lib/client';
import { Empty, ErrorBox, PageHead, Spinner } from '@/components/ui';

export default function Notifications() {
  const t = useTranslations('nt');
  const locale = useLocale();
  const { data, error, loading, reload } = useQuery<any[]>('/me/notifications');
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  const unread = data.filter((n) => !n.readAt).length;
  return (
    <div>
      <PageHead title={t('title')}>
        {unread > 0 && <button className="btn btn-ghost" onClick={async () => { await api('/me/notifications/read', { method: 'POST', body: {} }); reload(); }}>{t('markRead')}</button>}
      </PageHead>
      {data.length === 0 ? <Empty text={t('empty')} /> : (
        <ul className="space-y-2">
          {data.map((n) => {
            const title = n.scholarship?.tr?.title ?? n.scholarship?.slug ?? '';
            const text = n.type === 'DEADLINE_REMINDER' ? t('deadline', { title, n: n.payload?.level ?? '' }) : n.type === 'ADMIN_MESSAGE' && n.payload?.title ? `${n.payload.title}: ${n.payload.body ?? ''}` : t('system');
            const inner = (
              <>
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.readAt ? 'bg-navy/15' : 'bg-primary'}`} />
                <span className="min-w-0 flex-1"><span className={`block ${n.readAt ? 'text-ink/70' : 'font-semibold text-navy'}`}>{text}</span><span className="text-xs text-muted">{new Date(n.createdAt).toLocaleString(locale)}</span></span>
              </>
            );
            return <li key={n.id}>{n.scholarship ? <Link href={`/scholarships/${n.scholarship.slug}`} className="card flex gap-3 p-4">{inner}</Link> : <div className="card flex gap-3 p-4">{inner}</div>}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
