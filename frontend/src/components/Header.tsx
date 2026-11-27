'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import LangSwitch from './LangSwitch';
import Logo from './Logo';
import PwaClient from './PwaClient';
import { Icon } from './ui';
import { useBackClose } from '@/lib/useBackClose';

const NAV = [
  { href: '/', key: 'home' },
  { href: '/scholarships', key: 'catalog' },
  { href: '/programs', key: 'programs' },
  { href: '/countries', key: 'countries' },
  { href: '/stories', key: 'stories' },
  { href: '/about', key: 'about' },
] as const;

export default function Header() {
  const t = useTranslations('nav');
  const s = useTranslations('shell');
  const { user } = useAuth();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useBackClose(open, () => setOpen(false));
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  const active = (h: string) => (h === '/' ? path === '/' : path.startsWith(h));
  const cta = user ? (
    <Link href={user.role === 'ADMIN' ? '/admin' : '/app'} className="btn btn-primary">{s('dashboard')}</Link>
  ) : user === null ? (
    <>
      <Link href="/login" className="btn btn-ghost">{t('login')}</Link>
      <Link href="/register" className="btn btn-primary">{t('register')}</Link>
    </>
  ) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-navy/15 lg:hidden" aria-expanded={open} aria-label={t('menu')} onClick={() => setOpen((v) => !v)}>
            <Icon name={open ? 'x' : 'menu'} />
          </button>
          <Link href="/" aria-label="Grantora" className="shrink-0"><Logo /></Link>
        </div>
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active(n.href) ? 'bg-accent text-primary-600' : 'text-navy hover:bg-canvas hover:text-primary'}`}>
              {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden md:block"><PwaClient /></span>
          <span className="hidden md:block"><LangSwitch /></span>
          <div className="hidden items-center gap-2 lg:flex">{cta}</div>
          {user === null && <Link href="/login" className="btn btn-primary !h-10 !px-4 text-sm lg:hidden">{t('login')}</Link>}
          {user && <Link href={user.role === 'ADMIN' ? '/admin' : '/app'} className="btn btn-primary !h-10 !px-4 text-sm lg:hidden">{s('dashboard')}</Link>}
        </div>
      </div>

      {/* Mobil menyu: chapdan ochiladigan panel — sahifalar, til, ilovani o'rnatish, kirish va ro'yxatdan o'tish */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t('menu')}>
          <button className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} aria-label="close" />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[88%] flex-col bg-white shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-navy/10 px-4">
              <Link href="/" aria-label="Grantora"><Logo /></Link>
              <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-canvas" onClick={() => setOpen(false)} aria-label="close"><Icon name="x" /></button>
            </div>
            <nav aria-label="Mobile" className="flex-1 space-y-1 overflow-y-auto p-3">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined}
                  className={`flex h-12 items-center rounded-xl px-4 text-base font-semibold ${active(n.href) ? 'bg-accent text-primary-600' : 'text-navy hover:bg-canvas'}`}>
                  {t(n.key)}
                </Link>
              ))}
              <Link href="/faq" className="flex h-12 items-center rounded-xl px-4 text-base font-semibold text-navy hover:bg-canvas">{t('faq')}</Link>
              <Link href="/contact" className="flex h-12 items-center rounded-xl px-4 text-base font-semibold text-navy hover:bg-canvas">{t('contact')}</Link>
            </nav>
            <div className="shrink-0 space-y-2 border-t border-navy/10 p-3">
              <LangSwitch className="w-full" />
              <PwaClient full />
              <div className="grid grid-cols-2 gap-2 pt-1 [&>a]:w-full">{cta}</div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
