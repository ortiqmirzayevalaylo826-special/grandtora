'use client';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, routing } from '@/i18n/routing';
import { Icon } from './ui';

/** Til nomlari har doim to'liq yoziladi (EN emas, English). */
export const LANG_NAMES: Record<string, string> = { uz: "O'zbekcha", ru: 'Русский', en: 'English' };

export default function LangSwitch({ className = '' }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <label className={`relative inline-flex h-10 items-center rounded-xl border border-navy/15 bg-white text-navy hover:border-primary/50 ${className}`}>
      <Icon name="globe" className="pointer-events-none absolute left-2.5 h-[18px] w-[18px] text-muted" />
      <select value={locale} onChange={(e) => router.replace(pathname, { locale: e.target.value as (typeof routing.locales)[number] })} aria-label="Language"
        className="h-full cursor-pointer appearance-none rounded-xl bg-transparent pl-9 pr-7 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        {routing.locales.map((l) => <option key={l} value={l}>{LANG_NAMES[l] ?? l}</option>)}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2.5 text-[10px] text-muted">▾</span>
    </label>
  );
}
