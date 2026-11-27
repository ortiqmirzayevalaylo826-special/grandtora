'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import { useBackClose } from '@/lib/useBackClose';
import Logo from './Logo';
import PwaClient from './PwaClient';
import { Icon } from './ui';

export const NAV = [
  { href: '/', key: 'home' },
  { href: '/scholarships', key: 'catalog' },
  { href: '/programs', key: 'programs' },
  { href: '/countries', key: 'countries' },
  { href: '/stories', key: 'stories' },
  { href: '/about', key: 'about' },
] as const;

/** Chapdagi menyu tugmasi: bosilganda chapdan panel ochiladi (sahifalar, kirish, ro'yxatdan o'tish, ilovani o'rnatish). Barcha ekranlarda ishlaydi. */
export default function SiteMenu({ className = '' }: { className?: string }) {
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
  const row = (on: boolean) => `flex h-12 items-center rounded-xl px-4 text-base font-semibold ${on ? 'bg-accent text-primary-600' : 'text-navy hover:bg-canvas'}`;
  return (
    <>
      <button type="button" className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-navy/15 bg-white hover:bg-canvas ${className}`} aria-expanded={open} aria-label={t('menu')} onClick={() => setOpen(true)}><Icon name="menu" /></button>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={t('menu')}>
          <button className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} aria-label="close" />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[88%] flex-col bg-white shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-navy/10 px-4">
              <Link href="/" aria-label="Grantora"><Logo /></Link>
              <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-canvas" onClick={() => setOpen(false)} aria-label="close"><Icon name="x" /></button>
            </div>
            <nav aria-label="Menu" className="flex-1 space-y-1 overflow-y-auto p-3">
              {NAV.map((n) => <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined} className={row(active(n.href))}>{t(n.key)}</Link>)}
              <Link href="/faq" className={row(false)}>{t('faq')}</Link>
              <Link href="/contact" className={row(false)}>{t('contact')}</Link>
            </nav>
            <div className="shrink-0 space-y-2 border-t border-navy/10 p-3">
              <PwaClient full />
              {user ? <Link href={user.role === 'ADMIN' ? '/admin' : '/app'} className="btn btn-primary w-full">{s('dashboard')}</Link>
                : user === null ? <div className="grid grid-cols-2 gap-2 [&>a]:w-full"><Link href="/login" className="btn btn-ghost">{t('login')}</Link><Link href="/register" className="btn btn-primary">{t('register')}</Link></div> : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
