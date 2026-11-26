'use client';
import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, useQuery } from '@/lib/client';
import { ErrorBox, Notice, PageHead, Spinner, useErr } from '@/components/ui';

export default function AdminCatalog() {
  const t = useTranslations('ad');
  const c = useTranslations('common');
  const err = useErr();
  const cats = useQuery<any[]>('/admin/categories');
  const cos = useQuery<any[]>('/admin/countries');
  const [cat, setCat] = useState({ slug: '', nameUz: '', nameRu: '', nameEn: '' });
  const [co, setCo] = useState({ code: '', nameUz: '', nameRu: '', nameEn: '' });
  const [msg, setMsg] = useState('');

  const run = async (fn: () => Promise<unknown>, after: () => void) => { setMsg(''); try { await fn(); after(); } catch (x: any) { setMsg(err(x.code)); } };
  const addCat = (e: FormEvent) => { e.preventDefault(); run(() => api('/admin/categories', { body: cat }), () => { setCat({ slug: '', nameUz: '', nameRu: '', nameEn: '' }); cats.reload(); }); };
  const addCo = (e: FormEvent) => { e.preventDefault(); run(() => api('/admin/countries', { method: 'PUT', body: { ...co, code: co.code.toUpperCase() } }), () => { setCo({ code: '', nameUz: '', nameRu: '', nameEn: '' }); cos.reload(); }); };

  if (cats.loading || cos.loading) return <Spinner />;
  if (cats.error || cos.error || !cats.data || !cos.data) return <ErrorBox code={cats.error ?? cos.error ?? 'generic'} />;
  const inp = (v: string, on: (s: string) => void, ph: string, extra = '') => <input className={`input ${extra}`} required placeholder={ph} aria-label={ph} value={v} onChange={(e) => on(e.target.value)} />;
  return (
    <div className="space-y-8">
      <PageHead title={t('categories')} />
      {msg && <Notice kind="err">{msg}</Notice>}
      <section className="card p-5">
        <ul className="mb-4 divide-y divide-navy/5">{cats.data.map((x) => (
          <li key={x.id} className="flex items-center gap-3 py-2 text-sm"><span className="min-w-0 flex-1 truncate"><b className="text-navy">{x.nameEn}</b> <span className="text-muted">/ {x.nameUz} / {x.nameRu} · {x.slug} · {t('count', { n: x._count.scholarships })}</span></span>
            <button className="btn btn-ghost h-8 px-3 text-xs text-red-700" onClick={() => confirm(c('confirm')) && run(() => api(`/admin/categories/${x.id}`, { method: 'DELETE' }), cats.reload)}>{c('delete')}</button></li>
        ))}</ul>
        <form onSubmit={addCat} className="grid gap-2 sm:grid-cols-5">
          {inp(cat.slug, (v) => setCat({ ...cat, slug: v }), 'slug')}{inp(cat.nameUz, (v) => setCat({ ...cat, nameUz: v }), t('nameUz'))}{inp(cat.nameRu, (v) => setCat({ ...cat, nameRu: v }), t('nameRu'))}{inp(cat.nameEn, (v) => setCat({ ...cat, nameEn: v }), t('nameEn'))}
          <button className="btn btn-primary">{t('add')}</button>
        </form>
      </section>

      <PageHead title={t('countries')} />
      <section className="card p-5">
        <ul className="mb-4 grid gap-x-6 sm:grid-cols-2">{cos.data.map((x) => (
          <li key={x.code} className="flex items-center gap-3 border-b border-navy/5 py-2 text-sm"><span className="min-w-0 flex-1 truncate"><b className="text-navy">{x.code}</b> {x.nameEn} <span className="text-muted">· {t('count', { n: x._count.scholarships })}</span></span>
            <button className="btn btn-ghost h-8 px-3 text-xs text-red-700" onClick={() => confirm(c('confirm')) && run(() => api(`/admin/countries/${x.code}`, { method: 'DELETE' }), cos.reload)}>{c('delete')}</button></li>
        ))}</ul>
        <form onSubmit={addCo} className="grid gap-2 sm:grid-cols-5">
          {inp(co.code, (v) => setCo({ ...co, code: v }), t('code'))}{inp(co.nameUz, (v) => setCo({ ...co, nameUz: v }), t('nameUz'))}{inp(co.nameRu, (v) => setCo({ ...co, nameRu: v }), t('nameRu'))}{inp(co.nameEn, (v) => setCo({ ...co, nameEn: v }), t('nameEn'))}
          <button className="btn btn-primary">{t('add')}</button>
        </form>
      </section>
    </div>
  );
}
