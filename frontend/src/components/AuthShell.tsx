'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { useQuery } from '@/lib/client';
import { Icon } from './ui';

/** Kirish/ro'yxatdan o'tish uchun ikki panelli qobiq: chapda yashil rasmli panel, o'ngda forma.
 *  Telefonda chap panel ixcham yuqori band bo'ladi (rasm va statistika yashirinadi), forma ostida to'liq kenglikda. */
export default function AuthShell({ mode, children }: { mode: 'login' | 'register'; children: React.ReactNode }) {
  const t = useTranslations('auth');
  const h = useTranslations('home');
  const { data: st } = useQuery<{ scholarships: number; countries: number; students: number }>('/public/stats');
  const reg = mode === 'register';
  const feats = ['pf1', 'pf2', 'pf3', 'pf4'] as const;
  const icons = ['log', 'bell', 'folder', 'chart'];
  const nums = [
    { v: st?.scholarships, l: h('statGrants'), i: 'star' },
    { v: st?.countries, l: h('statCountries'), i: 'globe' },
    { v: st?.students, l: h('statStudents'), i: 'users' },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/60 via-canvas to-white sm:px-4 sm:py-8 lg:grid lg:place-items-center">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden bg-white shadow-card sm:rounded-[28px] sm:border sm:border-navy/10 lg:min-h-[640px] lg:grid-cols-[0.92fr_1.08fr]">
        {/* Chap panel */}
        <aside className="relative isolate flex flex-col overflow-hidden bg-gradient-to-b from-[#064E3B] to-primary px-6 pb-6 pt-6 text-white lg:px-9 lg:pt-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Grantora">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-mark.png" alt="" width={40} height={40} className="h-10 w-10 rounded-lg bg-white/95 p-1" />
            <span className="font-head text-2xl font-extrabold">Grantora</span>
          </Link>
          <h2 className="mt-5 max-w-md text-2xl font-extrabold leading-tight !text-white lg:mt-8 lg:text-[32px]">
            {reg ? t('pRegTitle1') : t('pLoginTitle1')} <span className="text-[#86efac]">{reg ? t('pRegTitle2') : t('pLoginTitle2')}</span>
          </h2>
          <p className="mt-3 hidden max-w-sm text-sm text-white/85 sm:block lg:text-base">{reg ? t('pRegSub') : t('pLoginSub')}</p>

          {reg ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/auth-register.jpg" alt="" width={360} height={910} className="pointer-events-none absolute -bottom-2 right-0 -z-10 hidden h-[78%] w-auto object-contain opacity-95 lg:block" style={{ maskImage: 'linear-gradient(to right, transparent, #000 35%)' }} />
              <ul className="relative mt-auto hidden space-y-3 pt-8 text-sm font-semibold lg:block">
                {feats.map((k, i) => <li key={k} className="flex items-center gap-3"><Icon name={icons[i]} className="h-5 w-5 text-[#86efac]" />{t(k)}</li>)}
              </ul>
            </>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/auth-login.jpg" alt="" width={908} height={600} className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-[52%] w-full object-cover object-top lg:block" style={{ maskImage: 'linear-gradient(to bottom, transparent, #000 30%)' }} />
              <div className="relative mt-auto hidden grid-cols-3 gap-2 pt-8 text-center lg:grid">
                {nums.map((n) => (
                  <div key={n.l} className="rounded-xl bg-[#064E3B]/70 px-2 py-2 backdrop-blur">
                    <p className="font-head text-lg font-extrabold">{n.v ?? '—'}</p>
                    <p className="text-[11px] leading-tight text-white/80">{n.l}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>
        {/* O'ng panel: forma */}
        <section className="px-5 py-8 sm:px-10 lg:px-12 lg:py-10">{children}</section>
      </div>
    </div>
  );
}
