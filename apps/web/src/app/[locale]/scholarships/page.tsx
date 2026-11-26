import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Paged, Scholarship, apiGet } from '@/lib/api';
import ScholarshipCard from '@/components/ScholarshipCard';

export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join(',') : v ?? '');

export default async function Catalog({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SP> }) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();

  const qs = new URLSearchParams({ locale, limit: '12' });
  for (const k of ['q', 'countries', 'levels', 'funding', 'deadlineWithinDays', 'sort', 'page']) { const v = one(sp[k]); if (v) qs.set(k, v); }
  if (sp.noEssay) qs.set('noEssay', 'true');
  const data = await apiGet<Paged<Scholarship>>(`/scholarships?${qs}`);
  const countries = (await apiGet<{ code: string; nameUz: string; nameRu: string; nameEn: string }[]>('/scholarships/countries')) ?? [];
  const sel = (k: string) => one(sp[k]).split(',').filter(Boolean);

  const pageHref = (p: number) => { const q = new URLSearchParams(); for (const [k, v] of Object.entries(sp)) if (k !== 'page' && v) q.set(k, one(v)); q.set('page', String(p)); return `/scholarships?${q}`; };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold">{t('catalog.title')}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filtrlar oddiy GET forma: JavaScriptsiz ham ishlaydi, URL ulashiladi, qidiruv robotlari ko'radi */}
        <form className="card h-fit space-y-5 p-5" method="get">
          <input className="input" name="q" defaultValue={one(sp.q)} placeholder={t('home.search')} aria-label={t('home.search')} />
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-navy">{t('catalog.country')}</legend>
            <div className="max-h-44 space-y-1.5 overflow-auto pr-1">
              {countries.map((c) => (
                <label key={c.code} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="countries" value={c.code} defaultChecked={sel('countries').includes(c.code)} />
                  {locale === 'ru' ? c.nameRu : locale === 'en' ? c.nameEn : c.nameUz}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-navy">{t('catalog.level')}</legend>
            {['BACHELOR', 'MASTER', 'PHD'].map((l) => (
              <label key={l} className="mb-1.5 flex items-center gap-2 text-sm">
                <input type="checkbox" name="levels" value={l} defaultChecked={sel('levels').includes(l)} /> {t(`level.${l}`)}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-navy">{t('catalog.funding')}</legend>
            {['FULL', 'PARTIAL', 'TUITION', 'LIVING'].map((f) => (
              <label key={f} className="mb-1.5 flex items-center gap-2 text-sm">
                <input type="checkbox" name="funding" value={f} defaultChecked={sel('funding').includes(f)} /> {t(`funding.${f}`)}
              </label>
            ))}
          </fieldset>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="noEssay" value="true" defaultChecked={!!sp.noEssay} /> {t('catalog.noEssay')}</label>
          <div>
            <label className="mb-2 block text-sm font-bold text-navy" htmlFor="dl">{t('catalog.deadline')}</label>
            <select id="dl" name="deadlineWithinDays" className="input" defaultValue={one(sp.deadlineWithinDays)}>
              <option value="">{t('catalog.any')}</option><option value="30">{t('catalog.d30')}</option><option value="90">{t('catalog.d90')}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1">{t('catalog.apply')}</button>
            <Link href="/scholarships" className="btn btn-ghost">{t('catalog.reset')}</Link>
          </div>
        </form>

        <div>
          <p className="mb-4 text-sm text-muted">{t('catalog.found', { n: data?.total ?? 0 })}</p>
          {data && data.items.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">{data.items.map((s) => <ScholarshipCard key={s.id} s={s} />)}</div>
          ) : (
            <div className="card p-10 text-center"><h2 className="text-lg font-bold">{t('catalog.none')}</h2><p className="mt-1 text-muted">{t('catalog.noneHint')}</p></div>
          )}
          {data && data.pages > 1 && (
            <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={pageHref(p)} aria-current={p === data.page ? 'page' : undefined}
                  className={`btn h-10 min-w-10 px-3 ${p === data.page ? 'btn-primary' : 'btn-ghost'}`}>{p}</Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
