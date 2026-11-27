'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@/lib/client';
import { Scholarship } from '@/lib/api';
import { Empty, ErrorBox, PageHead, Spinner } from '@/components/ui';
import ScholarshipCard from '@/components/ScholarshipCard';
import { Pagination, useL } from '@/components/admin/kit';

interface Paged { items: Scholarship[]; total: number; page: number; pages: number; limit: number }
interface F { q: string; countries: string[]; levels: string[]; funding: string[]; noEssay: boolean; deadlineWithinDays: string; sort: string }
const EMPTY: F = { q: '', countries: [], levels: [], funding: [], noEssay: false, deadlineWithinDays: '', sort: 'deadline' };

/** Kabinet ichidagi grantlar katalogi: kabinetdan chiqmasdan qidirish, filtrlash va ko'rish. */
export default function AppGrants() {
  const t = useTranslations();
  const L = useL();
  const locale = useLocale();
  const [f, setF] = useState<F>(() => ({ ...EMPTY, q: typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('q') ?? '' }));
  const [qInput, setQInput] = useState(f.q);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  useEffect(() => { const x = setTimeout(() => { setF((o) => (o.q === qInput.trim() ? o : { ...o, q: qInput.trim() })); setPage(1); }, 350); return () => clearTimeout(x); }, [qInput]);

  const qs = new URLSearchParams({ locale, limit: '12', page: String(page), sort: f.sort });
  if (f.q) qs.set('q', f.q);
  if (f.countries.length) qs.set('countries', f.countries.join(','));
  if (f.levels.length) qs.set('levels', f.levels.join(','));
  if (f.funding.length) qs.set('funding', f.funding.join(','));
  if (f.noEssay) qs.set('noEssay', 'true');
  if (f.deadlineWithinDays) qs.set('deadlineWithinDays', f.deadlineWithinDays);
  const list = useQuery<Paged>(`/scholarships?${qs}`);
  const countries = useQuery<{ code: string; nameUz: string; nameRu: string; nameEn: string }[]>('/scholarships/countries');
  const upd = (p: Partial<F>) => { setF((o) => ({ ...o, ...p })); setPage(1); };
  const toggle = (k: 'countries' | 'levels' | 'funding', v: string) => upd({ [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] } as Partial<F>);
  const dirty = f.q || f.countries.length || f.levels.length || f.funding.length || f.noEssay || f.deadlineWithinDays;
  const reset = () => { setQInput(''); setF(EMPTY); setPage(1); };
  const cname = (c: { nameUz: string; nameRu: string; nameEn: string }) => (locale === 'ru' ? c.nameRu : locale === 'en' ? c.nameEn : c.nameUz);

  const Check = ({ on, label, onChange }: { on: boolean; label: string; onChange: () => void }) => <label className="mb-1.5 flex items-center gap-2 text-sm"><input type="checkbox" checked={on} onChange={onChange} /> {label}</label>;
  const filters = (
    <div className="card space-y-5 p-5">
      <fieldset><legend className="mb-2 text-sm font-bold text-navy">{t('catalog.country')}</legend>
        <div className="max-h-44 space-y-1.5 overflow-auto pr-1">{(countries.data ?? []).map((c) => <Check key={c.code} on={f.countries.includes(c.code)} label={cname(c)} onChange={() => toggle('countries', c.code)} />)}</div></fieldset>
      <fieldset><legend className="mb-2 text-sm font-bold text-navy">{t('catalog.level')}</legend>
        {['BACHELOR', 'MASTER', 'PHD', 'POSTDOC', 'SHORT'].map((l) => <Check key={l} on={f.levels.includes(l)} label={t(`level.${l}`)} onChange={() => toggle('levels', l)} />)}</fieldset>
      <fieldset><legend className="mb-2 text-sm font-bold text-navy">{t('catalog.funding')}</legend>
        {['FULL', 'PARTIAL', 'TUITION', 'LIVING'].map((x) => <Check key={x} on={f.funding.includes(x)} label={t(`funding.${x}`)} onChange={() => toggle('funding', x)} />)}</fieldset>
      <Check on={f.noEssay} label={t('catalog.noEssay')} onChange={() => upd({ noEssay: !f.noEssay })} />
      <label className="block text-sm font-bold text-navy">{t('catalog.deadline')}
        <select className="input mt-1 font-normal" value={f.deadlineWithinDays} onChange={(e) => upd({ deadlineWithinDays: e.target.value })}><option value="">{t('catalog.any')}</option><option value="30">{t('catalog.d30')}</option><option value="90">{t('catalog.d90')}</option></select></label>
      {dirty ? <button className="btn btn-ghost w-full" onClick={reset}>{t('catalog.reset')}</button> : null}
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHead title={t('shell.explore')} />
      <div className="flex flex-wrap gap-2">
        <input className="input min-w-0 flex-1" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder={t('home.search')} aria-label={t('home.search')} />
        <select className="input w-auto" value={f.sort} onChange={(e) => upd({ sort: e.target.value })} aria-label={t('catalog.sortLabel')}>
          <option value="deadline">{t('catalog.byDeadline')}</option><option value="new">{t('catalog.byNew')}</option><option value="popular">{t('catalog.byPopular')}</option>
        </select>
        <button className="btn btn-ghost lg:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open}>{t('catalog.filters')}{dirty ? ' •' : ''}</button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
        <div className={`${open ? 'block' : 'hidden'} lg:block`}>{filters}</div>
        <div className="min-w-0">
          {list.error ? <ErrorBox code={list.error} onRetry={list.reload} /> : !list.data ? <Spinner /> : (
            <>
              <p className="mb-3 text-sm text-muted">{t('catalog.found', { n: list.data.total })}</p>
              {list.data.items.length === 0 ? <Empty text={`${t('catalog.none')} ${t('catalog.noneHint')}`} /> : (
                <div className="grid gap-4 md:grid-cols-2">{list.data.items.map((s) => <ScholarshipCard key={s.id} s={s} base="/app/grants" />)}</div>
              )}
              {list.data.pages > 1 && <Pagination page={list.data.page} pages={list.data.pages} total={list.data.total} limit={list.data.limit} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
            </>
          )}
          <p className="sr-only">{L('Grantlar katalogi', 'Каталог грантов', 'Grants catalog')}</p>
        </div>
      </div>
    </div>
  );
}
