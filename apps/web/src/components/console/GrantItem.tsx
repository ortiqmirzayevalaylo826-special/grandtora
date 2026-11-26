'use client';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { countryName, daysLeft } from '@/lib/api';

/** Kabinetdagi ro'yxat elementi: nomi, tashkilot/davlat, belgilar, muddat; o'ng tomonda amallar. */
export default function GrantItem({ s, children, aside }: { s: any; children?: React.ReactNode; aside?: React.ReactNode }) {
  const t = useTranslations();
  const locale = useLocale();
  const d = daysLeft(s.deadline);
  const urgent = d !== null && d >= 0 && d <= 7;
  return (
    <article className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <Link href={`/scholarships/${s.slug}`} className="block truncate text-base font-bold text-navy hover:text-primary">{s.tr?.title ?? s.slug}</Link>
        <p className="mt-0.5 truncate text-sm text-muted">{s.organization} · {countryName(s.country, locale)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="chip">{t(`funding.${s.funding}`)}</span>
          {s.isDemo && <span className="chip bg-amber-100 !text-amber-800">{t('card.demo')}</span>}
          <span className={`text-xs font-semibold ${urgent ? 'text-red-600' : 'text-navy/70'}`}>
            {s.rolling ? t('card.rolling') : d === null ? '' : d < 0 ? t('card.expired') : t('card.daysLeft', { n: d })}
          </span>
        </div>
        {aside}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </article>
  );
}
