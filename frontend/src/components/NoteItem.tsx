'use client';
import { useDateFmt, useL } from './admin/kit';
import { Icon } from './ui';
import type { Item, Level } from './useInbox';

export const TONE: Record<Level, string> = { good: 'bg-emerald-50 text-emerald-700', warn: 'bg-amber-50 text-amber-700', info: 'bg-blue-50 text-blue-700', bad: 'bg-red-50 text-red-700' };

/** Bitta bildirishnoma qatori (qo'ng'iroqcha paneli va to'liq sahifada bir xil). */
export default function NoteItem({ it, onClick, expanded = false, trailing }: { it: Item; onClick: () => void; expanded?: boolean; trailing?: string }) {
  const f = useDateFmt();
  const L = useL();
  return (
    <button type="button" onClick={onClick} className={`flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-canvas ${it.read ? '' : 'bg-accent/40'}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONE[it.level]}`}><Icon name={it.icon} className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className={`flex items-center gap-2 text-sm ${it.read ? 'font-semibold text-navy/80' : 'font-bold text-navy'}`}>{it.title}{!it.read && <i className="h-2 w-2 shrink-0 rounded-full bg-primary" />}</span>
        {it.body && <span className={`mt-0.5 block text-[13px] text-ink/70 ${expanded ? 'whitespace-pre-wrap break-words' : 'line-clamp-2'}`}>{it.body}</span>}
        <span className="mt-1 block text-[11px] text-muted">{it.at ? f.ago(it.at) : L('Bugun', 'Сегодня', 'Today')}</span>
      </span>
      {trailing && <span aria-hidden className="self-center text-muted">{trailing}</span>}
    </button>
  );
}
