'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { api, useQuery } from '@/lib/client';
import { useAuth } from '@/lib/auth';
import { ErrorBox, Field, Notice, PageHead, Spinner, useErr } from '@/components/ui';

const PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

export default function Settings() {
  const t = useTranslations('st');
  const c = useTranslations('common');
  const err = useErr();
  const router = useRouter();
  const { setUser } = useAuth();
  const { data, error, loading, reload } = useQuery<{ emailReminders: boolean; email: string }>('/me/settings');
  const [rem, setRem] = useState(true);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [del, setDel] = useState('');
  const [m1, setM1] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [m2, setM2] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [m3, setM3] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  useEffect(() => { if (data) setRem(data.emailReminders); }, [data]);

  async function toggle(v: boolean) {
    setRem(v);
    try { await api('/me/settings', { method: 'PATCH', body: { emailReminders: v } }); setM1({ kind: 'ok', text: c('saved') }); } catch (x: any) { setRem(!v); setM1({ kind: 'err', text: err(x.code) }); }
  }
  async function changePw(e: FormEvent) {
    e.preventDefault(); setM2(null);
    if (!PW.test(pw.next)) return setM2({ kind: 'err', text: err('weak_password') });
    try { await api('/me/password', { body: pw }); setPw({ current: '', next: '' }); setM2({ kind: 'ok', text: t('changed') }); } catch (x: any) { setM2({ kind: 'err', text: err(x.code) }); }
  }
  async function remove(e: FormEvent) {
    e.preventDefault(); setM3(null);
    if (!confirm(c('confirm'))) return;
    try { await api('/me', { method: 'DELETE', body: { password: del } }); setUser(null); router.replace('/'); } catch (x: any) { setM3({ kind: 'err', text: err(x.code) }); }
  }

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  return (
    <div className="space-y-6">
      <PageHead title={t('title')} />
      <section className="card space-y-3 p-5">
        <p className="text-sm text-muted">{data.email}</p>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={rem} onChange={(e) => toggle(e.target.checked)} /> {t('reminders')}</label>
        {m1 && <Notice kind={m1.kind}>{m1.text}</Notice>}
      </section>
      <form onSubmit={changePw} className="card grid gap-4 p-5 sm:grid-cols-2">
        <h2 className="text-lg font-bold sm:col-span-2">{t('password')}</h2>
        <Field label={t('current')}><input className="input" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></Field>
        <Field label={t('password')}><input className="input" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></Field>
        {m2 && <div className="sm:col-span-2"><Notice kind={m2.kind}>{m2.text}</Notice></div>}
        <div className="sm:col-span-2"><button className="btn btn-primary">{c('save')}</button></div>
      </form>
      <form onSubmit={remove} className="card space-y-3 border-red-200 p-5">
        <h2 className="text-lg font-bold text-red-700">{t('danger')}</h2>
        <p className="text-sm text-muted">{t('dangerHint')}</p>
        <input className="input max-w-sm" type="password" autoComplete="current-password" value={del} onChange={(e) => setDel(e.target.value)} aria-label={t('current')} required />
        {m3 && <Notice kind={m3.kind}>{m3.text}</Notice>}
        <button className="btn bg-red-600 text-white hover:bg-red-700">{c('delete')}</button>
      </form>
    </div>
  );
}
