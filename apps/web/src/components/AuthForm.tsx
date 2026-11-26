'use client';
import { FormEvent, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { api, ApiError } from '@/lib/client';
import { AuthUser, useAuth } from '@/lib/auth';
import { Notice, useErr } from './ui';

const PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const t = useTranslations('auth');
  const err = useErr();
  const locale = useLocale();
  const router = useRouter();
  const { setUser } = useAuth();
  // login: parol yoki kod; register: forma → kod
  const [via, setVia] = useState<'password' | 'code'>('password');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', password: '', code: '' });
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const done = (u: AuthUser) => { setUser(u); router.replace(u.role === 'ADMIN' ? '/admin' : '/app'); };
  const registerBody = { firstName: f.firstName, lastName: f.lastName, email: f.email, password: f.password, locale };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (mode === 'register' && step === 'form' && !PW.test(f.password)) return setMsg({ kind: 'err', text: err('weak_password') });
    setBusy(true);
    try {
      if (mode === 'login' && via === 'password') {
        done((await api<{ user: AuthUser }>('/auth/login', { body: { email: f.email, password: f.password } })).user);
      } else if (mode === 'login') {
        if (step === 'form') { await api('/auth/login/otp/request', { body: { email: f.email } }); setStep('otp'); setMsg({ kind: 'ok', text: t('resent') }); }
        else done((await api<{ user: AuthUser }>('/auth/login/otp/verify', { body: { email: f.email, code: f.code } })).user);
      } else if (step === 'form') {
        await api('/auth/register', { body: registerBody });
        setStep('otp');
      } else {
        done((await api<{ user: AuthUser }>('/auth/verify', { body: { email: f.email, code: f.code } })).user);
      }
    } catch (x) {
      setMsg({ kind: 'err', text: err((x as ApiError).code) });
    } finally { setBusy(false); }
  }

  async function resend() {
    setMsg(null);
    try {
      if (mode === 'register') await api('/auth/register', { body: registerBody });
      else await api('/auth/login/otp/request', { body: { email: f.email } });
      setMsg({ kind: 'ok', text: t('resent') });
    } catch (x) { setMsg({ kind: 'err', text: err((x as ApiError).code) }); }
  }

  const needPassword = !(mode === 'login' && via === 'code');
  const submitLabel = busy ? t('busy') : step === 'otp' ? t('confirm') : mode === 'login' ? (via === 'code' ? t('sendCode') : t('login')) : t('register');

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <div className="card p-7">
        <h1 className="text-2xl font-extrabold">{mode === 'login' ? t('welcome') : t('createAcc')}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          {step === 'otp' ? (
            <>
              <p className="text-sm text-muted">{t('codeSent', { email: f.email })}</p>
              <input className="input text-center text-xl tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={f.code} onChange={set('code')} placeholder="······" aria-label={t('code')} autoFocus />
              <button type="button" onClick={resend} className="text-sm font-semibold text-primary">{t('resend')}</button>
              <p className="text-xs text-muted">{t('wait')}</p>
            </>
          ) : (
            <>
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <input className="input" placeholder={t('first')} aria-label={t('first')} value={f.firstName} onChange={set('firstName')} autoComplete="given-name" required />
                  <input className="input" placeholder={t('last')} aria-label={t('last')} value={f.lastName} onChange={set('lastName')} autoComplete="family-name" required />
                </div>
              )}
              <input className="input" type="email" placeholder={t('email')} aria-label={t('email')} value={f.email} onChange={set('email')} autoComplete="email" required />
              {needPassword && <input className="input" type="password" placeholder={t('password')} aria-label={t('password')} value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />}
            </>
          )}
          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          <button className="btn btn-primary w-full" disabled={busy}>{submitLabel}</button>
        </form>

        {mode === 'login' && step === 'form' && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <button type="button" className="font-semibold text-primary" onClick={() => { setVia(via === 'password' ? 'code' : 'password'); setMsg(null); }}>
              {via === 'password' ? t('viaCode') : t('viaPassword')}
            </button>
            <Link href="/forgot" className="text-muted hover:text-primary">{t('forgot')}</Link>
          </div>
        )}
        <p className="mt-5 text-center text-sm text-muted">
          {mode === 'login' ? t('noAcc') : t('haveAcc')}{' '}
          <Link className="font-semibold text-primary" href={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? t('register') : t('login')}</Link>
        </p>
      </div>
    </div>
  );
}
