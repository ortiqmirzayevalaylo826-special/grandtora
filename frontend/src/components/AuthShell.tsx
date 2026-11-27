'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useQuery } from '@/lib/client';
import { Icon } from './ui';
import LangSwitch from './LangSwitch';
import PwaClient from './PwaClient';

/** Kirish/ro'yxatdan o'tish: chapda TO'LIQ rasm (ustida yengil gradient va matn), o'ngda forma.
 *  Tilni almashtirish va "Ilovani o'rnatish" tugmalari yuqorida doim ko'rinadi. Telefonda chap panel ixcham rasmli banner. */
export default function AuthShell({ mode, children }: { mode: 'login' | 'register'; children: React.ReactNode }) {
  const t = useTranslations('auth');
  const h = useTranslations('home');
  const { data: st } = useQuery<{ scholarships: number; countries: number; students: number }>('/public/stats');
  const reg = mode === 'register';
  const feats = ['pf1', 'pf2', 'pf3', 'pf4'] as const;
  const icons = ['log', 'bell', 'folder', 'chart'];
  const nums = [
    { v: st?.scholarships, l: h('statGrants') },
    { v: st?.countries, l: h('statCountries') },
    { v: st?.students, l: h('statStudents') },
  ];
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-accent/60 via-canvas to-white sm:px-4 sm:py-6 lg:justify-center">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-end gap-2 px-4 py-3 sm:px-0 sm:pb-3 sm:pt-0">
        <PwaClient />
        <LangSwitch />
      </div>
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden bg-white shadow-card sm:rounded-[28px] sm:border sm:border-navy/10 lg:min-h-[640px] lg:grid-cols-[0.92fr_1.08fr]">
        {/* Chap panel: rasm to'liq ko'rinadi, matn uning ustida */}
        <aside className="relative isolate flex min-h-[260px] flex-col justify-between overflow-hidden bg-[#064E3B] px-6 pb-6 pt-6 text-white lg:min-h-0 lg:px-9 lg:pb-8 lg:pt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={reg ? '/img/auth-register.jpg' : '/img/auth-login.jpg'} alt="" className={`pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover ${reg ? 'object-[50%_0%]' : 'object-[50%_15%]'}`} />
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ background: 'linear-gradient(to top, rgba(6,78,59,.96) 0%, rgba(6,78,59,.82) 28%, rgba(6,78,59,.25) 55%, rgba(6,78,59,0) 70%), linear-gradient(to bottom, rgba(6,78,59,.55) 0%, rgba(6,78,59,0) 22%)' }} />

          <Link href="/" className="flex w-fit items-center gap-2.5" aria-label="Grantora">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-mark.png" alt="" width={40} height={40} className="h-10 w-10 rounded-lg bg-white/95 p-1" />
            <span className="font-head text-2xl font-extrabold drop-shadow">Grantora</span>
          </Link>

          <div className="mt-24 lg:mt-0">
            <h2 className="max-w-md text-2xl font-extrabold leading-tight !text-white drop-shadow lg:text-[32px]">
              {reg ? t('pRegTitle1') : t('pLoginTitle1')} <span className="text-[#86efac]">{reg ? t('pRegTitle2') : t('pLoginTitle2')}</span>
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/90 lg:text-base">{reg ? t('pRegSub') : t('pLoginSub')}</p>
            {reg ? (
              <ul className="mt-6 hidden space-y-3 text-sm font-semibold lg:block">
                {feats.map((k, i) => <li key={k} className="flex items-center gap-3"><Icon name={icons[i]} className="h-5 w-5 text-[#86efac]" />{t(k)}</li>)}
              </ul>
            ) : (
              <div className="mt-6 hidden grid-cols-3 gap-2 text-center lg:grid">
                {nums.map((n) => (
                  <div key={n.l} className="rounded-xl bg-[#064E3B]/60 px-2 py-2 backdrop-blur">
                    <p className="font-head text-lg font-extrabold">{n.v ?? '—'}</p>
                    <p className="text-[11px] leading-tight text-white/85">{n.l}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
        <section className="px-5 py-8 sm:px-10 lg:px-12 lg:py-10">{children}</section>
      </div>
    </div>
  );
}
