'use client';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import LangSwitch from './LangSwitch';
import Logo from './Logo';
import PwaClient from './PwaClient';
import SiteMenu, { NAV } from './SiteMenu';

/** Sayt sarlavhasi: chapda menyu tugmasi (xl dan kichik ekranlarda) va logotip, o'ngda til UZ/RU/EN, o'rnatish, kirish. */
export default function Header() {
  const t = useTranslations('nav');
  const s = useTranslations('shell');
  const { user } = useAuth();
  const path = usePathname();
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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <SiteMenu className="xl:hidden" />
          <Link href="/" aria-label="Grantora" className="shrink-0"><Logo /></Link>
        </div>
        <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active(n.href) ? 'bg-accent text-primary-600' : 'text-navy hover:bg-canvas hover:text-primary'}`}>
              {t(n.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden md:block"><PwaClient /></span>
          <LangSwitch />
          <div className="hidden items-center gap-2 md:flex">{cta}</div>
        </div>
      </div>
    </header>
  );
}
