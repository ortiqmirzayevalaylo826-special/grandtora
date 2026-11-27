'use client';
import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useL } from './admin/kit';
import { Icon } from './ui';
import NoteItem from './NoteItem';
import { useInbox } from './useInbox';

/** Qo'ng'iroqcha: bosilganda panel ochiladi. Xabarlar ustiga bosilsa tegishli sahifaga o'tadi. */
export default function NotificationBell({ unread, onChange }: { unread: number; onChange?: () => void }) {
  const L = useL();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [only, setOnly] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inbox = useInbox({ list: open });
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent | TouchEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', down); document.addEventListener('touchstart', down); window.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('touchstart', down); window.removeEventListener('keydown', key); };
  }, [open]);
  const sorted = [...inbox.items].sort((a, b) => Number(a.read) - Number(b.read) || (b.at ?? '').localeCompare(a.at ?? ''));
  const list = sorted.filter((i) => !only || !i.read).slice(0, 12);
  return (
    <div className="relative" ref={ref}>
      <button type="button" className={`relative grid h-10 w-10 place-items-center rounded-xl hover:bg-canvas ${open ? 'bg-canvas' : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={L('Bildirishnomalar', 'Уведомления', 'Notifications')}>
        <Icon name="bell" />{unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <div className="fixed inset-x-2 top-[68px] z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[400px]">
          <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] px-4 py-3">
            <h2 className="text-base font-bold text-navy">{L('Bildirishnomalar', 'Уведомления', 'Notifications')}</h2>
            <div className="flex items-center gap-1">
              {unread > 0 && <button className="rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-accent" onClick={async () => { await inbox.readAll(); onChange?.(); }}>{L("Hammasini o'qish", 'Прочитать все', 'Mark all read')}</button>}
              <Link href="/app/settings" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-canvas" aria-label={L('Sozlamalar', 'Настройки', 'Settings')}><Icon name="settings" className="h-[18px] w-[18px]" /></Link>
            </div>
          </div>
          <div className="flex gap-1.5 px-3 pt-2">
            {[[false, L('Hammasi', 'Все', 'All')], [true, L("O'qilmagan", 'Непрочитанные', 'Unread')]].map(([v, l]) => <button key={String(v)} onClick={() => setOnly(v as boolean)} className={`rounded-full px-3 py-1 text-xs font-semibold ${only === v ? 'bg-primary text-white' : 'bg-canvas text-navy'}`}>{l as string}</button>)}
          </div>
          <div className="min-h-[120px] flex-1 overflow-y-auto p-2">
            {inbox.loading ? <p className="p-6 text-center text-sm text-muted">…</p> : list.length === 0 ? (
              <div className="grid place-items-center gap-2 px-4 py-10 text-center"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-primary"><Icon name="bell" className="h-7 w-7" /></span><p className="font-bold text-navy">{L("Yangi xabar yo'q", 'Новых сообщений нет', 'No new notifications')}</p><p className="text-sm text-muted">{L("Eslatmalar va yangiliklar shu yerda paydo bo'ladi.", 'Напоминания и новости появятся здесь.', 'Reminders and news will appear here.')}</p></div>
            ) : list.map((it) => <NoteItem key={it.key} it={it} onClick={async () => { await inbox.open(it); setOpen(false); if (!it.link) router.push('/app/notifications'); onChange?.(); }} />)}
          </div>
          <div className="border-t border-[#E5E7EB] p-2"><Link href="/app/notifications" onClick={() => setOpen(false)} className="btn btn-ghost !h-10 w-full text-sm">{L("Barchasini ko'rish", 'Показать все', 'View all')}</Link></div>
        </div>
      )}
    </div>
  );
}
