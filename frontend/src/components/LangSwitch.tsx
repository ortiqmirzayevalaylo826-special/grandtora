'use client';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, routing } from '@/i18n/routing';

/** Til nomlari (to'liq). */
export const LANG_NAMES: Record<string, string> = { uz: "O'zbekcha", ru: 'Русский', en: 'English' };

/** Til almashtirgich: UZ | RU | EN — segmentli tugma, doim ko'rinib turadi. full=true bo'lsa to'liq nomlar (sozlamalarda). */
export default function LangSwitch({ className = '', full = false }: { className?: string; full?: boolean }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div role="group" aria-label="Language" className={`inline-flex h-10 shrink-0 items-center rounded-xl bg-white p-1 ring-1 ring-inset ring-navy/15 ${className}`}>
      {routing.locales.map((l) => (
        <button key={l} type="button" aria-pressed={l === locale} title={LANG_NAMES[l]} lang={l}
          onClick={() => l !== locale && router.replace(pathname, { locale: l })}
          className={`h-8 rounded-lg text-xs font-bold tracking-wide transition ${full ? 'px-3 text-sm normal-case' : 'px-2.5 uppercase'} ${l === locale ? 'bg-primary text-white shadow-sm' : 'text-navy/70 hover:bg-accent hover:text-primary'}`}>
          {full ? LANG_NAMES[l] : l}
        </button>
      ))}
    </div>
  );
}
