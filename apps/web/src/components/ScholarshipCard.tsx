import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Scholarship, countryName, daysLeft } from '@/lib/api';

export default function ScholarshipCard({ s }: { s: Scholarship }) {
  const t = useTranslations();
  const locale = useLocale();
  const d = daysLeft(s.deadline);
  const urgent = d !== null && d >= 0 && d <= 7;
  return (
    <article className="card flex flex-col gap-3 p-5">
      <div>
        <h3 className="text-lg font-bold leading-snug">{s.tr?.title ?? s.slug}</h3>
        <p className="mt-1 text-sm text-muted">{s.organization} · {countryName(s.country, locale)}</p>
      </div>
      <p className="line-clamp-2 text-sm text-ink/80">{s.tr?.summary}</p>
      <div className="flex flex-wrap gap-2">
        <span className="chip">{t(`funding.${s.funding}`)}</span>
        {s.levels.map((l) => <span key={l} className="chip bg-navy/5 !text-navy">{t(`level.${l}`)}</span>)}
        {s.isDemo && <span className="chip bg-amber-100 !text-amber-800">{t('card.demo')}</span>}
      </div>
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className={`text-sm font-semibold ${urgent ? 'text-red-600' : 'text-navy'}`}>
          {s.rolling ? t('card.rolling') : d === null ? '' : d < 0 ? t('card.expired') : t('card.daysLeft', { n: d })}
        </span>
        <Link href={`/scholarships/${s.slug}`} className="btn btn-ghost h-9 px-4">{t('card.details')}</Link>
      </div>
    </article>
  );
}
