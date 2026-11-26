'use client';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, routing } from '@/i18n/routing';

export default function LangSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="flex rounded-lg border border-navy/10 bg-white p-0.5" role="group" aria-label="Language">
      {routing.locales.map((l) => (
        <button key={l} onClick={() => router.replace(pathname, { locale: l })} aria-pressed={l === locale}
          className={`rounded-md px-2 py-1 text-xs font-bold ${l === locale ? 'bg-navy text-white' : 'text-muted hover:text-navy'}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
