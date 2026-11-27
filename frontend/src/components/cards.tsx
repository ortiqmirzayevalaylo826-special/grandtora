import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { CountryCard as CountryT, Program, Story, countryName } from '@/lib/api';
import Flag from './Flag';

export function ProgramCard({ p }: { p: Program }) {
  const t = useTranslations('programs');
  const k = useTranslations('kind');
  const locale = useLocale();
  return (
    <article className="card flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <span className="chip">{k(p.kind)}</span>
        {p.countryCode && <span className="flex items-center gap-2 text-xs text-muted"><Flag code={p.countryCode} className="h-4 w-6" />{countryName(p.country ?? undefined, locale)}</span>}
      </div>
      <h3 className="text-lg font-bold leading-snug"><Link href={`/programs/${p.slug}`} className="hover:text-primary">{p.tr.title}</Link></h3>
      <p className="text-xs font-semibold text-muted">{p.organization}</p>
      <p className="line-clamp-3 text-sm text-ink/80">{p.tr.summary}</p>
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div><dt className="text-muted">{t('duration')}</dt><dd className="font-semibold text-navy">{p.tr.duration}</dd></div>
        <div><dt className="text-muted">{t('who')}</dt><dd className="line-clamp-2 font-semibold text-navy">{p.tr.who}</dd></div>
      </dl>
      <div className="mt-auto flex gap-2 pt-2">
        <Link href={`/programs/${p.slug}`} className="btn btn-primary h-9 flex-1 px-4">{t('details')}</Link>
        <a href={p.officialUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost h-9 px-4">{t('official')}</a>
      </div>
    </article>
  );
}

export function CountryTile({ c }: { c: CountryT }) {
  const t = useTranslations('countries');
  return (
    <Link href={`/countries/${c.code}`} className="card group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <Flag code={c.code} className="h-8 w-12" />
        <h3 className="text-lg font-bold group-hover:text-primary">{c.name}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="chip">{t('grants', { n: c.scholarships })}</span>
        {c.programs > 0 && <span className="chip bg-navy/5 !text-navy">{t('programs', { n: c.programs })}</span>}
        {c.eduLang && <span className="chip bg-navy/5 !text-navy">{c.eduLang}</span>}
      </div>
      {c.universities.length > 0 && <p className="line-clamp-2 text-sm text-muted">{c.universities.slice(0, 3).join(' · ')}</p>}
      {c.info && <p className="line-clamp-3 text-sm text-ink/80">{c.info}</p>}
      <span className="mt-auto text-sm font-semibold text-primary">{t('details')} →</span>
    </Link>
  );
}

const initials = (n: string) => n.split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
export function Avatar({ name, size = 'h-14 w-14 text-lg' }: { name: string; size?: string }) {
  return <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-head font-extrabold text-primary-600 ${size}`}>{initials(name)}</span>;
}

export function StoryCard({ s }: { s: Story }) {
  const t = useTranslations('stories');
  const locale = useLocale();
  return (
    <article className="card flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <Avatar name={s.name} />
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">{s.name}</h3>
          <p className="truncate text-sm text-muted">{s.university}{s.country ? ` · ${countryName(s.country, locale)}` : ''}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="chip">{s.program}</span>
        {s.isSample && <span className="chip bg-amber-100 !text-amber-800">{t('sample')}</span>}
      </div>
      <blockquote className="text-sm leading-relaxed text-ink/85">“{s.tr.quote}”</blockquote>
      <Link href={`/stories/${s.slug}`} className="mt-auto text-sm font-semibold text-primary">{t('read')} →</Link>
    </article>
  );
}
