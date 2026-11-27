'use client';
import { useState } from 'react';
import { Icon } from '@/components/ui';
import { useL } from '@/components/admin/kit';

export interface GuideItem { icon: string; title: string; steps: string[] }

/** Qo'llanma: qidiruv + ochiladigan bo'limlar (telefonda ham qulay). */
export function Guide({ items }: { items: GuideItem[] }) {
  const L = useL();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<number | null>(0);
  const s = q.trim().toLowerCase();
  const list = items.map((it, i) => ({ it, i })).filter(({ it }) => !s || it.title.toLowerCase().includes(s) || it.steps.some((x) => x.toLowerCase().includes(s)));
  return (
    <div className="space-y-3">
      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={L("Qo'llanmadan qidirish…", 'Поиск по руководству…', 'Search the guide…')} aria-label={L('Qidirish', 'Поиск', 'Search')} />
      {list.length === 0 && <p className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center text-sm text-muted">{L('Hech narsa topilmadi', 'Ничего не найдено', 'Nothing found')}</p>}
      {list.map(({ it, i }) => {
        const isOpen = !!s || open === i;
        return (
          <section key={i} className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
            <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left" aria-expanded={isOpen} onClick={() => setOpen(isOpen && !s ? null : i)}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-primary"><Icon name={it.icon} className="h-[18px] w-[18px]" /></span>
              <span className="flex-1 font-bold text-navy">{it.title}</span>
              <span aria-hidden className={`text-muted transition ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {isOpen && <ol className="list-decimal space-y-2 border-t border-[#E5E7EB] px-4 py-4 pl-9 text-sm leading-relaxed text-ink/85">{it.steps.map((x, k) => <li key={k}>{x}</li>)}</ol>}
          </section>
        );
      })}
    </div>
  );
}
