'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { api, useQuery } from '@/lib/client';
import { ErrorBox, Field, Notice, PageHead, Spinner, useErr } from '@/components/ui';

const LOCALES = ['uz', 'ru', 'en'] as const;
const LEVELS = ['BACHELOR', 'MASTER', 'PHD', 'POSTDOC', 'SHORT'];
const FUNDING = ['FULL', 'PARTIAL', 'TUITION', 'LIVING'];
const lines = (v: string) => v.split('\n').map((x) => x.trim()).filter(Boolean);
const num = (v: string) => (v.trim() === '' ? null : Number(v));

type Tr = { title: string; summary: string; description: string; eligibility: string; documents: string; process: string };
const emptyTr = (): Tr => ({ title: '', summary: '', description: '', eligibility: '', documents: '', process: '' });

export default function ScholarshipForm({ id }: { id?: string }) {
  const t = useTranslations('ad');
  const root = useTranslations();
  const c = useTranslations('common');
  const err = useErr();
  const router = useRouter();
  const countries = useQuery<any[]>('/admin/countries');
  const cats = useQuery<any[]>('/admin/categories');
  const existing = useQuery<any>(id ? `/admin/scholarships/${id}` : null);

  const [f, setF] = useState<any>({ slug: '', organization: '', countryCode: '', categoryId: '', levels: [] as string[], fields: '', funding: 'FULL', languageReq: '', ieltsMin: '', gpaMin: '', ageMin: '', ageMax: '', deadline: '', rolling: false, noEssay: false, featured: false, isDemo: false, officialUrl: '', coverImage: '' });
  const [tr, setTr] = useState<Record<string, Tr>>({ uz: emptyTr(), ru: emptyTr(), en: emptyTr() });
  const [tab, setTab] = useState<(typeof LOCALES)[number]>('uz');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = existing.data;
    if (!s) return;
    const v = (x: unknown) => (x == null ? '' : String(x));
    setF({ slug: s.slug, organization: s.organization, countryCode: s.countryCode, categoryId: v(s.categoryId), levels: s.levels, fields: (s.fields ?? []).join(', '), funding: s.funding, languageReq: v(s.languageReq), ieltsMin: v(s.ieltsMin), gpaMin: v(s.gpaMin), ageMin: v(s.ageMin), ageMax: v(s.ageMax), deadline: s.deadline ? String(s.deadline).slice(0, 10) : '', rolling: s.rolling, noEssay: s.noEssay, featured: s.featured, isDemo: s.isDemo, officialUrl: s.officialUrl, coverImage: v(s.coverImage) });
    const next: Record<string, Tr> = { uz: emptyTr(), ru: emptyTr(), en: emptyTr() };
    for (const x of s.translations ?? []) next[x.locale] = { title: x.title, summary: x.summary, description: v(x.description), eligibility: v(x.eligibility), documents: (x.documents ?? []).join('\n'), process: (x.process ?? []).join('\n') };
    setTr(next);
  }, [existing.data]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });
  const setT = (k: keyof Tr) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setTr({ ...tr, [tab]: { ...tr[tab], [k]: e.target.value } });
  const toggleLevel = (l: string) => setF({ ...f, levels: f.levels.includes(l) ? f.levels.filter((x: string) => x !== l) : [...f.levels, l] });

  async function submit(e: FormEvent) {
    e.preventDefault(); setMsg(null);
    const translations = LOCALES.filter((l) => tr[l].title.trim() && tr[l].summary.trim()).map((l) => ({
      locale: l, title: tr[l].title.trim(), summary: tr[l].summary.trim(),
      description: tr[l].description.trim() || undefined, eligibility: tr[l].eligibility.trim() || undefined,
      documents: lines(tr[l].documents), process: lines(tr[l].process),
    }));
    if (!translations.length) return setMsg({ kind: 'err', text: err('translation_required') });
    if (!f.levels.length) return setMsg({ kind: 'err', text: `${t('levels')}?` });
    const body = {
      slug: f.slug.trim(), organization: f.organization.trim(), countryCode: f.countryCode, categoryId: f.categoryId || null, levels: f.levels,
      fields: f.fields.split(',').map((x: string) => x.trim()).filter(Boolean), funding: f.funding, languageReq: f.languageReq.trim() || null,
      ieltsMin: num(f.ieltsMin), gpaMin: num(f.gpaMin), ageMin: num(f.ageMin), ageMax: num(f.ageMax), deadline: f.rolling || !f.deadline ? null : f.deadline,
      rolling: f.rolling, noEssay: f.noEssay, featured: f.featured, isDemo: f.isDemo, officialUrl: f.officialUrl.trim(), coverImage: f.coverImage.trim() || null, translations,
    };
    setBusy(true);
    try {
      if (id) await api(`/admin/scholarships/${id}`, { method: 'PUT', body }); else await api('/admin/scholarships', { body });
      router.push('/admin/scholarships');
    } catch (x: any) { setMsg({ kind: 'err', text: err(x.code) }); setBusy(false); }
  }

  if (countries.loading || cats.loading || existing.loading) return <Spinner />;
  const loadErr = countries.error ?? cats.error ?? existing.error;
  if (loadErr) return <ErrorBox code={loadErr} />;
  const cur = tr[tab];

  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHead title={id ? c('edit') : t('new')}><Link href="/admin/scholarships" className="btn btn-ghost">{c('back')}</Link></PageHead>

      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <Field label={t('slug')}><input className="input" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} value={f.slug} onChange={set('slug')} placeholder="daad-scholarships" /></Field>
        <Field label={t('org')}><input className="input" required maxLength={160} value={f.organization} onChange={set('organization')} /></Field>
        <Field label={t('countryCode')}>
          <select className="input" required value={f.countryCode} onChange={set('countryCode')}><option value="" />{countries.data?.map((x) => <option key={x.code} value={x.code}>{x.nameEn} ({x.code})</option>)}</select>
        </Field>
        <Field label={t('category')}>
          <select className="input" value={f.categoryId} onChange={set('categoryId')}><option value="">—</option>{cats.data?.map((x) => <option key={x.id} value={x.id}>{x.nameEn}</option>)}</select>
        </Field>
        <Field label={t('funding')}><select className="input" value={f.funding} onChange={set('funding')}>{FUNDING.map((x) => <option key={x} value={x}>{root(`funding.${x}`)}</option>)}</select></Field>
        <fieldset className="text-sm"><legend className="mb-1 font-semibold text-navy">{t('levels')}</legend>
          <div className="flex flex-wrap gap-4 pt-2">{LEVELS.map((l) => <label key={l} className="flex items-center gap-2"><input type="checkbox" checked={f.levels.includes(l)} onChange={() => toggleLevel(l)} />{root(`level.${l}`)}</label>)}</div>
        </fieldset>
        <Field label={t('fields')} className="sm:col-span-2"><input className="input" value={f.fields} onChange={set('fields')} /></Field>
        <Field label={t('lang')}><input className="input" maxLength={5} value={f.languageReq} onChange={set('languageReq')} /></Field>
        <Field label={t('ieltsMin')}><input className="input" type="number" step="0.5" min="0" max="9" value={f.ieltsMin} onChange={set('ieltsMin')} /></Field>
        <Field label={t('gpaMin')}><input className="input" type="number" step="0.01" min="0" max="4" value={f.gpaMin} onChange={set('gpaMin')} /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label={t('ageMin')}><input className="input" type="number" min="10" max="99" value={f.ageMin} onChange={set('ageMin')} /></Field><Field label={t('ageMax')}><input className="input" type="number" min="10" max="99" value={f.ageMax} onChange={set('ageMax')} /></Field></div>
        <Field label={t('deadline')}><input className="input" type="date" disabled={f.rolling} value={f.deadline} onChange={set('deadline')} /></Field>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-6 text-sm">
          {([['rolling', 'rolling'], ['noEssay', 'noEssay'], ['featured', 'featured'], ['isDemo', 'isDemo']] as const).map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={f[k]} onChange={set(k)} />{t(l)}</label>)}
        </div>
        <Field label={t('url')} className="sm:col-span-2"><input className="input" type="url" required value={f.officialUrl} onChange={set('officialUrl')} placeholder="https://" /></Field>
        <Field label={t('cover')} className="sm:col-span-2"><input className="input" type="url" value={f.coverImage} onChange={set('coverImage')} placeholder="https://" /></Field>
      </section>

      <section className="card p-5">
        <div className="mb-4 flex gap-2" role="tablist">
          {LOCALES.map((l) => (
            <button type="button" key={l} role="tab" aria-selected={tab === l} onClick={() => setTab(l)}
              className={`btn h-9 px-4 text-xs ${tab === l ? 'btn-primary' : 'btn-ghost'}`}>{l.toUpperCase()}{tr[l].title && ' ✓'}</button>
          ))}
        </div>
        <div className="grid gap-4">
          <Field label={t('tTitle')}><input className="input" maxLength={200} value={cur.title} onChange={setT('title')} /></Field>
          <Field label={t('tSummary')}><input className="input" maxLength={400} value={cur.summary} onChange={setT('summary')} /></Field>
          <Field label={t('tDesc')}><textarea className="input h-32 py-2" maxLength={8000} value={cur.description} onChange={setT('description')} /></Field>
          <Field label={t('tElig')}><textarea className="input h-24 py-2" maxLength={4000} value={cur.eligibility} onChange={setT('eligibility')} /></Field>
          <Field label={t('tDocs')}><textarea className="input h-28 py-2" value={cur.documents} onChange={setT('documents')} /></Field>
          <Field label={t('tProcess')}><textarea className="input h-28 py-2" value={cur.process} onChange={setT('process')} /></Field>
        </div>
      </section>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="flex gap-2"><button className="btn btn-primary" disabled={busy}>{c('save')}</button><Link href="/admin/scholarships" className="btn btn-ghost">{c('cancel')}</Link></div>
    </form>
  );
}
