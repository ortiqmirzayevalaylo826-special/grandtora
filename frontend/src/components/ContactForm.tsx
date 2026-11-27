'use client';
import { FormEvent, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api } from '@/lib/client';
import { Field, Notice, useErr } from './ui';

/** Aloqa formasi: /api/contact → admin panelida "Murojaatlar" bo'limida ko'rinadi */
export default function ContactForm() {
  const t = useTranslations('contact');
  const locale = useLocale();
  const err = useErr();
  const [f, setF] = useState({ name: '', email: '', subject: '', message: '' });
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | string>('idle');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    setState('busy');
    try { await api('/contact', { body: { ...f, locale } }); setState('ok'); setF({ name: '', email: '', subject: '', message: '' }); }
    catch (x: any) { setState(`e:${x?.code ?? 'generic'}`); }
  }
  return (
    <form onSubmit={submit} className="card space-y-4 p-6" noValidate={false}>
      <h2 className="text-xl font-bold">{t('formT')}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('name')}><input className="input" required minLength={2} maxLength={80} value={f.name} onChange={set('name')} autoComplete="name" /></Field>
        <Field label={t('emailF')}><input className="input" type="email" required maxLength={254} value={f.email} onChange={set('email')} autoComplete="email" /></Field>
      </div>
      <Field label={t('subject')}><input className="input" required minLength={2} maxLength={120} value={f.subject} onChange={set('subject')} /></Field>
      <Field label={t('message')}><textarea className="input min-h-36 py-3" required minLength={5} maxLength={4000} value={f.message} onChange={set('message')} /></Field>
      {state === 'ok' && <Notice kind="ok">{t('sent')}</Notice>}
      {state.startsWith('e:') && <Notice kind="err">{err(state.slice(2))}</Notice>}
      <button className="btn btn-primary w-full sm:w-auto" disabled={state === 'busy'}>{t('send')}</button>
    </form>
  );
}
