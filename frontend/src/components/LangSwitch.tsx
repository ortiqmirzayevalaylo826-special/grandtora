'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, routing } from '@/i18n/routing';

/** Til nomlari (to'liq). */
export const LANG_NAMES: Record<string, string> = { uz: "O'zbekcha", ru: 'Русский', en: 'English' };

/** Til almashtirgich. Yopiq holatda faqat joriy til (masalan UZ) ko'rinadi; bossangiz qolganlari ochiladi.
 *  full=true (sozlamalar): barcha tillar to'liq nomi bilan doim ko'rinadi. */
export default function LangSwitch({ className = '', full = false }: { className?: string; full?: boolean }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  const pick = (l: string) => { setOpen(false); if (l !== locale) router.replace(pathname, { locale: l }); };

  if (full) {
    return (
      <div role="group" aria-label="Language" className={`inline-flex h-10 shrink-0 items-center rounded-xl bg-white p-1 ring-1 ring-inset ring-navy/15 ${className}`}>
        {routing.locales.map((l) => (
          <button key={l} type="button" aria-pressed={l === locale} lang={l} onClick={() => pick(l)}
            className={`h-8 rounded-lg px-3 text-sm font-bold transition ${l === locale ? 'bg-primary text-white shadow-sm' : 'text-navy/70 hover:bg-accent hover:text-primary'}`}>
            {LANG_NAMES[l]}
          </button>
        ))}
      </div>
    );
  }
  const others = routing.locales.filter((l) => l !== locale);
  return (
    <div ref={box} className={`relative inline-flex shrink-0 ${className}`}>
      <button type="button" aria-expanded={open} aria-label={`Language: ${LANG_NAMES[locale]}`} onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-1 rounded-xl bg-white px-3 text-xs font-bold uppercase tracking-wide text-navy ring-1 ring-inset ring-navy/15 transition hover:bg-accent hover:text-primary">
        {locale}
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-[80] mt-1 min-w-[9rem] overflow-hidden rounded-xl bg-white p-1 shadow-lg ring-1 ring-navy/10">
          {others.map((l) => (
            <button key={l} type="button" role="menuitem" lang={l} onClick={() => pick(l)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-navy hover:bg-accent hover:text-primary">
              <span className="w-6 text-xs font-bold uppercase text-primary">{l}</span>{LANG_NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
