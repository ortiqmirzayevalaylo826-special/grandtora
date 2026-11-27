import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Scholarship, countryName, daysLeft } from '@/lib/api';
import Flag from './Flag';
import SaveButton from './SaveButton';
import { Icon } from './ui';

export default function ScholarshipCard({ s }: { s: Scholarship }) {
  const t = useTranslations();
  const locale = useLocale();
  const d = daysLeft(s.deadline);
  const expired = d !== null && d < 0;
  const urgent = d !== null && d >= 0 && d <= 14;
  const date = s.deadline ? new Date(s.deadline).toLocaleDateString(locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return (
    <article className="card group flex min-w-0 flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start gap-3">
        <Flag code={s.countryCode} className="mt-0.5 h-8 w-12" />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 break-words text-base font-bold leading-snug">
            <Link href={`/scholarships/${s.slug}`} className="hover:text-primary">{s.tr?.title ?? s.slug}</Link>
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted">{s.organization} · {countryName(s.country, locale)}</p>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${expired ? 'bg-red-50 text-red-700' : 'bg-accent text-primary-600'}`}>
          {expired ? t('card.closed') : t('card.active')}
        </span>
      </div>
      <p className="line-clamp-2 break-words text-sm text-ink/80">{s.tr?.summary}</p>
      <div className="flex flex-wrap gap-2">
        {s.levels.map((l) => <span key={l} className="chip bg-navy/5 !text-navy">{t(`level.${l}`)}</span>)}
        <span className="chip">{t(`funding.${s.funding}`)}</span>
        {s.isDemo && <span className="chip bg-amber-100 !text-amber-800">{t('card.demo')}</span>}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-navy/5 pt-3">
        <div className={`flex min-w-0 items-center gap-2 text-xs font-semibold ${urgent || expired ? 'text-red-600' : 'text-navy'}`}>
          <Icon name="calendar" className="h-4 w-4 shrink-0" />
          <span className="truncate">{s.rolling ? t('card.rolling') : s.deadline ? `${t('card.deadlineLabel')} ${date}` : ''}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link href={`/scholarships/${s.slug}`} className="btn btn-ghost h-9 px-3 text-xs">{t('card.details')}</Link>
          <SaveButton id={s.id} />
        </div>
      </div>
    </article>
  );
}
