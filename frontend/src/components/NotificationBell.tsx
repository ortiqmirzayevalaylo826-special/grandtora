'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { api, useQuery } from '@/lib/client';
import { useDateFmt, useL } from './admin/kit';
import { Icon } from './ui';

interface N { id: string; type: 'DEADLINE_REMINDER' | 'ADMIN_MESSAGE' | 'SYSTEM'; payload: any; readAt: string | null; createdAt: string; scholarship: { slug: string; tr?: { title?: string } } | null }
type Level = 'good' | 'warn' | 'info' | 'bad';
const TONE: Record<Level, string> = { good: 'bg-emerald-50 text-emerald-700', warn: 'bg-amber-50 text-amber-700', info: 'bg-blue-50 text-blue-700', bad: 'bg-red-50 text-red-700' };

/** Qo'ng'iroqcha: bosilganda bildirishnomalar paneli ochiladi (rangli darajalar, "yangi" belgisi, bosilsa tegishli sahifaga o'tadi). */
export default function NotificationBell({ unread, onChange }: { unread: number; onChange?: () => void }) {
  const L = useL();
  const f = useDateFmt();
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data, reload, setData } = useQuery<N[]>(open ? '/me/notifications' : null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent | TouchEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', down); document.addEventListener('touchstart', down); window.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('touchstart', down); window.removeEventListener('keydown', key); };
  }, [open]);

  const view = (n: N): { icon: string; level: Level; title: string; body: string; link: string | null } => {
    const p = n.payload ?? {};
    const gt = n.scholarship?.tr?.title ?? n.scholarship?.slug ?? '';
    if (n.type === 'DEADLINE_REMINDER') return { icon: 'calendar', level: (p.level ?? 7) <= 1 ? 'bad' : 'warn', title: L('Muddat yaqinlashmoqda', 'Приближается срок', 'Deadline approaching'), body: gt, link: n.scholarship ? `/app/grants/${n.scholarship.slug}` : null };
    if (p.kind === 'chat') return { icon: 'msg', level: 'info', title: L('Administratordan yangi xabar', 'Новое сообщение от администратора', 'New message from the admin'), body: p.body ?? '', link: p.link ?? '/app/messages' };
    if (p.kind === 'complaint') return { icon: 'alert', level: 'good', title: L('Shikoyatingiz bo‘yicha javob', 'Ответ по жалобе', 'Reply to your complaint'), body: `${p.title ?? ''}`, link: p.link ?? '/app/help?tab=complain' };
    return { icon: 'bell', level: 'info', title: (p.title as string) || L('Tizim xabari', 'Системное сообщение', 'System notice'), body: (p.body as string) ?? '', link: '/app/notifications' };
  };
  async function go(n: N) {
    const v = view(n);
    if (!n.readAt) { setData((data ?? []).map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))); api(`/me/notifications/${n.id}/read`, { method: 'POST', body: {} }).then(() => onChange?.()).catch(() => undefined); }
    setOpen(false);
    if (v.link) router.push(v.link);
  }
  async function readAll() { await api('/me/notifications/read', { method: 'POST', body: {} }).catch(() => undefined); reload(); onChange?.(); }
  void locale;
  const list = (data ?? []).slice(0, 12);
  return (
    <div className="relative" ref={ref}>
      <button type="button" className={`relative grid h-10 w-10 place-items-center rounded-xl hover:bg-canvas ${open ? 'bg-canvas' : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={L('Bildirishnomalar', 'Уведомления', 'Notifications')}>
        <Icon name="bell" />{unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="fixed inset-x-2 top-[68px] z-50 max-h-[78vh] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[400px]">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
            <h2 className="text-base font-bold text-navy">{L('Bildirishnomalar', 'Уведомления', 'Notifications')}</h2>
            {unread > 0 && <button className="text-xs font-semibold text-primary hover:underline" onClick={readAll}>{L("Hammasini o'qilgan deb belgilash", 'Прочитать все', 'Mark all read')}</button>}
          </div>
          <div className="max-h-[calc(78vh-110px)] overflow-y-auto p-2">
            {!data ? <p className="p-6 text-center text-sm text-muted">…</p> : list.length === 0 ? (
              <div className="grid place-items-center gap-2 px-4 py-10 text-center"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary"><Icon name="bell" className="h-7 w-7" /></span><p className="font-bold text-navy">{L("Yangi xabar yo'q", 'Новых сообщений нет', 'No new notifications')}</p><p className="text-sm text-muted">{L("Eslatmalar va yangiliklar shu yerda paydo bo'ladi.", 'Напоминания и новости появятся здесь.', 'Reminders and news will appear here.')}</p></div>
            ) : list.map((n) => {
              const v = view(n);
              return (
                <button key={n.id} onClick={() => go(n)} className={`mb-1 flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-canvas ${n.readAt ? '' : 'bg-accent/40'}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${TONE[v.level]}`}><Icon name={v.icon} className="h-[18px] w-[18px]" /></span>
                  <span className="min-w-0 flex-1">
                    <span className={`flex items-center gap-2 text-sm ${n.readAt ? 'font-semibold text-navy/80' : 'font-bold text-navy'}`}>{v.title}{!n.readAt && <i className="h-2 w-2 shrink-0 rounded-full bg-primary" />}</span>
                    {v.body && <span className="mt-0.5 line-clamp-2 block text-[13px] text-ink/70">{v.body}</span>}
                    <span className="mt-1 block text-[11px] text-muted">{f.ago(n.createdAt)}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="border-t border-[#E5E7EB] p-2"><Link href="/app/notifications" onClick={() => setOpen(false)} className="btn btn-ghost !h-10 w-full text-sm">{L("Barchasini ko'rish", 'Показать все', 'View all')}</Link></div>
        </div>
      )}
    </div>
  );
}
