'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { api, useQuery } from '@/lib/client';
import { Empty, ErrorBox, Icon, PageHead, Spinner } from '@/components/ui';
import { useDateFmt, useL } from '@/components/admin/kit';

interface N { id: string; type: 'DEADLINE_REMINDER' | 'ADMIN_MESSAGE' | 'SYSTEM'; payload: any; readAt: string | null; createdAt: string; scholarship: { slug: string; tr?: { title?: string } } | null }

/** Bildirishnoma ustiga bosilsa, tegishli sahifaga o'tadi (grant, chat, shikoyat natijasi); e'lon bo'lsa to'liq matn ochiladi. */
export default function Notifications() {
  const t = useTranslations('nt');
  const L = useL();
  const f = useDateFmt();
  const router = useRouter();
  const { data, error, loading, reload, setData } = useQuery<N[]>('/me/notifications');
  const [openId, setOpenId] = useState<string | null>(null);
  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  const unread = data.filter((n) => !n.readAt).length;

  const view = (n: N) => {
    const p = n.payload ?? {};
    const title = n.scholarship?.tr?.title ?? n.scholarship?.slug ?? '';
    if (n.type === 'DEADLINE_REMINDER') return { icon: 'calendar', title: L('Muddat yaqinlashmoqda', 'Приближается срок', 'Deadline approaching'), body: t('deadline', { title, n: p.level ?? '' }), link: n.scholarship ? `/app/grants/${n.scholarship.slug}` : null };
    if (p.kind === 'chat') return { icon: 'msg', title: L('Administratordan yangi xabar', 'Новое сообщение от администратора', 'New message from the admin'), body: p.body ?? '', link: p.link ?? '/app/messages' };
    if (p.kind === 'complaint') return { icon: 'alert', title: L('Shikoyatingiz bo‘yicha javob', 'Ответ по вашей жалобе', 'Reply to your complaint'), body: `${p.title ?? ''}${p.body ? `: ${p.body}` : ''}`, link: p.link ?? '/app/help?tab=complain' };
    if (p.title) return { icon: 'bell', title: p.title as string, body: (p.body as string) ?? '', link: null as string | null };
    return { icon: 'bell', title: t('system'), body: '', link: null as string | null };
  };
  async function markRead(n: N) {
    if (n.readAt) return;
    setData(data!.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
    api(`/me/notifications/${n.id}/read`, { method: 'POST', body: {} }).catch(() => undefined);
  }
  async function click(n: N) {
    const v = view(n);
    await markRead(n);
    if (v.link) router.push(v.link); else setOpenId(openId === n.id ? null : n.id);
  }
  return (
    <div>
      <PageHead title={t('title')}>
        {unread > 0 && <button className="btn btn-ghost" onClick={async () => { await api('/me/notifications/read', { method: 'POST', body: {} }); reload(); }}>{t('markRead')}</button>}
      </PageHead>
      {data.length === 0 ? <Empty text={t('empty')} /> : (
        <ul className="space-y-2">
          {data.map((n) => {
            const v = view(n);
            const open = openId === n.id;
            return (
              <li key={n.id}>
                <button onClick={() => click(n)} aria-expanded={v.link ? undefined : open} className={`card flex w-full gap-3 p-4 text-left transition hover:-translate-y-0.5 ${n.readAt ? '' : 'border-primary/30 bg-accent/30'}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${n.readAt ? 'bg-navy/5 text-muted' : 'bg-primary text-white'}`}><Icon name={v.icon} className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className={`block ${n.readAt ? 'text-ink/70' : 'font-bold text-navy'}`}>{v.title}</span>
                    {v.body && <span className={`mt-0.5 block text-sm text-ink/75 ${open ? 'whitespace-pre-wrap break-words' : 'line-clamp-2'}`}>{v.body}</span>}
                    <span className="mt-1 block text-xs text-muted">{f.dt(n.createdAt)}</span>
                  </span>
                  <span aria-hidden className="self-center text-muted">{v.link ? '→' : open ? '▴' : '▾'}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
