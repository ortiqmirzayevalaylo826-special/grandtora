import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Scholarship, countryName, daysLeft } from '@/lib/api';
import Flag from './Flag';
import SaveButton from './SaveButton';

export default function ScholarshipCard({ s }: { s: Scholarship }) {
  const t = useTranslations();
  const locale = useLocale();
  const d = daysLeft(s.deadline);
  const urgent = d !== null && d >= 0 && d <= 7;
  return (
    <article className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Flag code={s.countryCode} className="h-6 w-9 shrink-0" />
          <p className="truncate text-sm text-muted">{s.organization} · {countryName(s.country, locale)}</p>
        </div>
        <SaveButton id={s.id} />
      </div>
      <h3 className="text-lg font-bold leading-snug">
        <Link href={`/scholarships/${s.slug}`} className="hover:text-primary">{s.tr?.title ?? s.slug}</Link>
      </h3>
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
