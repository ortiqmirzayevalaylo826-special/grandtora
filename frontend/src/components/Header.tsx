'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import LangSwitch from './LangSwitch';
import Logo from './Logo';
import PwaClient from './PwaClient';
import { Icon } from './ui';

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
        <Link href="/" aria-label="Grantora"><Logo /></Link>
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active(n.href) ? 'bg-accent text-primary-600' : 'text-navy hover:bg-canvas hover:text-primary'}`}>
              {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <PwaClient />
          <LangSwitch />
          <div className="hidden items-center gap-2 lg:flex">{cta}</div>
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-navy/15 lg:hidden" aria-expanded={open} aria-label={t('menu')} onClick={() => setOpen((v) => !v)}>
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>

      {/* Mobil menyu: alohida UX — butun ekran, katta bosish maydonlari */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-30 overflow-y-auto bg-white lg:hidden">
          <nav aria-label="Mobile" className="mx-auto max-w-6xl space-y-1 p-4">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined}
                className={`flex h-12 items-center rounded-xl px-4 text-base font-semibold ${active(n.href) ? 'bg-accent text-primary-600' : 'text-navy hover:bg-canvas'}`}>
                {t(n.key)}
              </Link>
            ))}
            <Link href="/faq" className="flex h-12 items-center rounded-xl px-4 text-base font-semibold text-navy hover:bg-canvas">{t('faq')}</Link>
            <Link href="/contact" className="flex h-12 items-center rounded-xl px-4 text-base font-semibold text-navy hover:bg-canvas">{t('contact')}</Link>
            <div className="grid grid-cols-2 gap-2 pt-4 [&>a]:w-full">{cta}</div>
          </nav>
        </div>
      )}
    </header>
  );
}
