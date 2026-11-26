'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { BRAND } from '@/brand';
import { useAuth } from '@/lib/auth';
import LangSwitch from './LangSwitch';
import PwaClient from './PwaClient';

export default function Header() {
  const t = useTranslations('nav');
  const s = useTranslations('shell');
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-head text-xl font-extrabold text-navy">
          <span className="text-primary">●</span> {BRAND.name}
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/scholarships" className="hidden text-sm font-medium text-navy hover:text-primary sm:block">{t('catalog')}</Link>
          <PwaClient />
          <LangSwitch />
          {user ? (
            <Link href={user.role === 'ADMIN' ? '/admin' : '/app'} className="btn btn-primary">{s('dashboard')}</Link>
          ) : user === null ? (
            <>
              <Link href="/login" className="btn btn-ghost hidden sm:inline-flex">{t('login')}</Link>
              <Link href="/register" className="btn btn-primary">{t('register')}</Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
