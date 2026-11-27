'use client';
import { FormEvent, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { api, ApiError } from '@/lib/client';
import { AuthUser, useAuth } from '@/lib/auth';
import AuthShell from './AuthShell';
import { Icon, Notice, useErr } from './ui';

const PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

/** Maydon: chapda ikonka, ixtiyoriy o'ngda tugma (parolni ko'rsatish) */
function Box({ icon, right, children }: { icon: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><Icon name={icon} className="h-[18px] w-[18px]" /></span>
      {children}
      {right && <span className="absolute right-2 top-1/2 -translate-y-1/2">{right}</span>}
    </div>
  );
}

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const t = useTranslations('auth');
  const err = useErr();
  const locale = useLocale();
  const router = useRouter();
  const { setUser } = useAuth();
  // via: password (parol) | code (kod bilan) | quick ("Google" tugmasi: faqat email → kod, hisob bo'lmasa yaratiladi)
  const [via, setVia] = useState<'password' | 'code' | 'quick'>('password');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', password: '', password2: '', code: '' });
  const [agree, setAgree] = useState(false);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const done = (u: AuthUser) => { setUser(u); router.replace(u.role === 'ADMIN' ? '/admin' : '/app'); };
  const registerBody = { firstName: f.firstName, lastName: f.lastName, email: f.email, password: f.password, locale };
  const reg = mode === 'register';
  const emailOnly = !reg && via !== 'password';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (reg && step === 'form') {
      if (!PW.test(f.password)) return setMsg({ kind: 'err', text: err('weak_password') });
      if (f.password !== f.password2) return setMsg({ kind: 'err', text: t('mismatch') });
      if (!agree) return setMsg({ kind: 'err', text: t('mustAgree') });
    }
    setBusy(true);
    try {
      if (!reg && via === 'password') {
        done((await api<{ user: AuthUser }>('/auth/login', { body: { email: f.email, password: f.password } })).user);
      } else if (!reg && via === 'code') {
        if (step === 'form') { await api('/auth/login/otp/request', { body: { email: f.email } }); setStep('otp'); setMsg({ kind: 'ok', text: t('resent') }); }
        else done((await api<{ user: AuthUser }>('/auth/login/otp/verify', { body: { email: f.email, code: f.code } })).user);
      } else if (!reg) {
        if (step === 'form') { await api('/auth/quick/request', { body: { email: f.email, locale } }); setStep('otp'); setMsg({ kind: 'ok', text: t('resent') }); }
        else done((await api<{ user: AuthUser }>('/auth/quick/verify', { body: { email: f.email, code: f.code } })).user);
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
      if (reg) await api('/auth/register', { body: registerBody });
      else if (via === 'quick') await api('/auth/quick/request', { body: { email: f.email, locale } });
      else await api('/auth/login/otp/request', { body: { email: f.email } });
      setMsg({ kind: 'ok', text: t('resent') });
    } catch (x) { setMsg({ kind: 'err', text: err((x as ApiError).code) }); }
  }

  const eye = (
    <button type="button" onClick={() => setShow((v) => !v)} aria-label={t('showPw')} aria-pressed={show} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-navy">
      <Icon name={show ? 'eyeoff' : 'eye'} className="h-[18px] w-[18px]" />
    </button>
  );
  const pwType = show ? 'text' : 'password';
  const submitLabel = busy ? t('busy') : step === 'otp' ? t('confirm') : !reg ? (via === 'password' ? t('login') : t('sendCode')) : t('register');
  const title = reg ? t('createAcc') : via === 'quick' ? t('quickTitle') : t('welcome');
  const sub = reg ? t('registerSub') : via === 'quick' ? t('quickHint') : t('loginSub');

  return (
    <AuthShell mode={mode}>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="mt-1.5 text-sm text-muted">{sub}</p>

        <form onSubmit={submit} className="mt-6 space-y-3.5" noValidate>
          {step === 'otp' ? (
            <>
              <p className="text-sm text-muted">{t('codeSent', { email: f.email })}</p>
              <input className="input h-14 text-center text-2xl tracking-[0.5em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={f.code} onChange={set('code')} placeholder="······" aria-label={t('code')} autoFocus />
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={resend} className="font-semibold text-primary">{t('resend')}</button>
                <button type="button" onClick={() => { setStep('form'); setMsg(null); }} className="text-muted hover:text-primary">{t('changeEmail')}</button>
              </div>
              <p className="text-xs text-muted">{t('wait')}</p>
            </>
          ) : (
            <>
              {reg && (
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Box icon="user"><input className="input !pl-10" placeholder={t('first')} aria-label={t('first')} value={f.firstName} onChange={set('firstName')} autoComplete="given-name" required /></Box>
                  <Box icon="user"><input className="input !pl-10" placeholder={t('last')} aria-label={t('last')} value={f.lastName} onChange={set('lastName')} autoComplete="family-name" required /></Box>
                </div>
              )}
              <Box icon="mail"><input className="input !h-12 !pl-10" type="email" placeholder={via === 'quick' ? 'name@gmail.com' : t('email')} aria-label={t('email')} value={f.email} onChange={set('email')} autoComplete="email" inputMode="email" required /></Box>
              {!emailOnly && (
                <Box icon="lock" right={eye}><input className="input !h-12 !pl-10 !pr-12" type={pwType} placeholder={t('password')} aria-label={t('password')} value={f.password} onChange={set('password')} autoComplete={reg ? 'new-password' : 'current-password'} required /></Box>
              )}
              {reg && (
                <Box icon="lock" right={eye}><input className="input !h-12 !pl-10 !pr-12" type={pwType} placeholder={t('confirmPw')} aria-label={t('confirmPw')} value={f.password2} onChange={set('password2')} autoComplete="new-password" required /></Box>
              )}
              {reg && (
                <label className="flex items-start gap-2.5 text-sm text-ink/85">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#087F5B]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                  <span>{t('agree1')} <Link href="/terms" className="font-semibold text-primary hover:underline">{t('terms')}</Link> {t('agree2')} <Link href="/privacy" className="font-semibold text-primary hover:underline">{t('privacy')}</Link> {t('agree3')}</span>
                </label>
              )}
            </>
          )}
          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          <button className="btn btn-primary !h-12 w-full text-base" disabled={busy}>{submitLabel}{!busy && <Icon name="arrow" className="h-4 w-4" />}</button>
        </form>

        {!reg && step === 'form' && via === 'password' && (
          <div className="mt-3 flex items-center justify-between text-sm">
            <button type="button" className="font-semibold text-primary" onClick={() => { setVia('code'); setMsg(null); }}>{t('viaCode')}</button>
            <Link href="/forgot" className="font-semibold text-primary hover:underline">{t('forgot')}</Link>
          </div>
        )}
        {!reg && step === 'form' && via !== 'password' && (
          <button type="button" className="mt-3 text-sm font-semibold text-primary" onClick={() => { setVia('password'); setMsg(null); }}>{t('viaPassword')}</button>
        )}

        {!reg && step === 'form' && via === 'password' && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-navy/10" />{t('orSocial')}<span className="h-px flex-1 bg-navy/10" /></div>
            <button type="button" onClick={() => { setVia('quick'); setMsg(null); }} className="btn btn-ghost !h-12 w-full gap-3 text-base">
              <GoogleG />{t('google')}
            </button>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          {reg ? t('haveAcc') : t('noAcc')}{' '}
          <Link className="font-bold text-primary hover:underline" href={reg ? '/login' : '/register'}>{reg ? t('login') : t('register')}</Link>
        </p>
      </div>
    </AuthShell>
  );
}
