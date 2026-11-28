'use client';
import { useState } from 'react';
import { useBackClose } from '@/lib/useBackClose';
import { Icon } from './ui';

export interface HubSection { id: string; icon: string; title: string; sub?: string; body: React.ReactNode }

/** Sozlamalar: bo'limlar ustun (ro'yxat) shaklida. Telefonda: ro'yxat → bo'lim ochiladi, "Orqaga" ro'yxatga qaytaradi.
 *  Kompyuterda: chapda ro'yxat, o'ngda tanlangan bo'lim. */
export default function SettingsHub({ sections, head }: { sections: HubSection[]; head?: React.ReactNode }) {
  const [sel, setSel] = useState<string | null>(null);
  useBackClose(sel !== null, () => setSel(null));
  const cur = sections.find((s) => s.id === sel) ?? sections[0];
  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_1fr] lg:items-start">
      <nav aria-label="Settings" className={`${sel ? 'hidden lg:block' : ''} overflow-hidden rounded-2xl border border-navy/10 bg-white`}>
        {head}
        <ul className="divide-y divide-navy/10">
          {sections.map((s) => {
            const on = s.id === cur.id;
            return (
              <li key={s.id}>
                <button type="button" onClick={() => setSel(s.id)} aria-current={on ? 'true' : undefined}
                  className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-canvas ${on ? 'lg:bg-accent' : ''}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${on ? 'bg-primary text-white' : 'bg-accent text-primary'}`}><Icon name={s.icon} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-navy">{s.title}</span>
                    {s.sub && <span className="block truncate text-xs text-muted">{s.sub}</span>}
                  </span>
                  <Icon name="chevron" className="h-4 w-4 text-muted" />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <section className={`${sel ? '' : 'hidden lg:block'} min-w-0 space-y-5`} aria-label={cur.title}>
        <button type="button" onClick={() => setSel(null)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary lg:hidden">
          <Icon name="chevron" className="h-4 w-4 rotate-180" /> {cur.title}
        </button>
        <h2 className="hidden text-xl font-bold text-navy lg:block">{cur.title}</h2>
        {cur.body}
      </section>
    </div>
  );
}
