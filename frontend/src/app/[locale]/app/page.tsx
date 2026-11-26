'use client';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@/lib/client';
import { Bar, Empty, ErrorBox, Spinner } from '@/components/ui';
import GrantItem from '@/components/console/GrantItem';

export default function Overview() {
  const t = useTranslations('ov');
  const st = useTranslations('status');
  const locale = useLocale();
  const { user } = useAuth();
  const { data, error, loading, reload } = useQuery<any>(`/me/overview?locale=${locale}`);
  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  const cards = [
    { k: 'saved', n: data.saved, href: '/app/saved' }, { k: 'apps', n: data.applications, href: '/app/applications' },
    { k: 'unread', n: data.unread, href: '/app/notifications' }, { k: 'docs', n: data.documents, href: '/app/documents' },
  ];
  const max = Math.max(1, ...Object.values<number>(data.byStatus));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">{t('hello', { name: user?.firstName ?? '' })}</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.k} href={c.href} className="card p-4 transition hover:-translate-y-0.5">
            <p className="font-head text-3xl font-extrabold text-navy">{c.n}</p>
            <p className="text-sm text-muted">{t(c.k)}</p>
          </Link>
        ))}
      </div>

      {data.profilePercent < 100 && (
        <Link href="/app/profile" className="card block p-4">
          <div className="flex items-center justify-between text-sm"><b className="text-navy">{t('profile')}</b><b className="text-primary">{data.profilePercent}%</b></div>
          <div className="mt-2 h-2.5 rounded-full bg-navy/5"><div className="h-2.5 rounded-full bg-primary" style={{ width: `${data.profilePercent}%` }} /></div>
          <p className="mt-2 text-sm text-muted">{t('fill')}</p>
        </Link>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">{t('upcoming')}</h2>
        {data.upcoming.length ? <div className="space-y-3">{data.upcoming.map((s: any) => <GrantItem key={s.id} s={s} />)}</div> : <Empty text={t('noUpcoming')} />}
      </section>

      {Object.keys(data.byStatus).length > 0 && (
        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">{t('pipeline')}</h2>
          {Object.entries<number>(data.byStatus).map(([k, v]) => <Bar key={k} label={st(k)} value={v} max={max} />)}
        </section>
      )}
    </div>
  );
}
