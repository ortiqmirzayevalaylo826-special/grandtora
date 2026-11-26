'use client';
import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { api, ApiError } from '@/lib/client';
import { Notice, useErr } from './ui';

const PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

export default function ForgotForm() {
  const t = useTranslations('auth');
  const err = useErr();
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [f, setF] = useState({ email: '', code: '', pw: '' });
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (step === 'reset' && !PW.test(f.pw)) return setMsg({ kind: 'err', text: err('weak_password') });
    setBusy(true);
    try {
      if (step === 'email') { await api('/auth/forgot', { body: { email: f.email } }); setStep('reset'); setMsg({ kind: 'ok', text: t('resent') }); }
      else { await api('/auth/reset', { body: { email: f.email, code: f.code, newPassword: f.pw } }); setStep('done'); }
    } catch (x) { setMsg({ kind: 'err', text: err((x as ApiError).code) }); } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="card p-7">
        <h1 className="text-2xl font-extrabold">{t('forgotTitle')}</h1>
        {step === 'done' ? (
          <div className="mt-5 space-y-4"><Notice kind="ok">{t('resetDone')}</Notice><Link href="/login" className="btn btn-primary w-full">{t('login')}</Link></div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            {step === 'email' ? (
              <>
                <p className="text-sm text-muted">{t('forgotHint')}</p>
                <input className="input" type="email" placeholder={t('email')} aria-label={t('email')} value={f.email} onChange={set('email')} autoComplete="email" required />
              </>
            ) : (
              <>
                <p className="text-sm text-muted">{t('codeSent', { email: f.email })}</p>
                <input className="input text-center text-xl tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={f.code} onChange={set('code')} placeholder="······" aria-label={t('code')} autoFocus />
                <input className="input" type="password" placeholder={t('newPassword')} aria-label={t('newPassword')} value={f.pw} onChange={set('pw')} autoComplete="new-password" />
              </>
            )}
            {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
            <button className="btn btn-primary w-full" disabled={busy}>{busy ? t('busy') : step === 'email' ? t('sendCode') : t('resetBtn')}</button>
            <Link href="/login" className="block text-center text-sm text-muted hover:text-primary">{t('backLogin')}</Link>
          </form>
        )}
      </div>
    </div>
  );
}
