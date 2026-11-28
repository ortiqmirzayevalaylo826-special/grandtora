'use client';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';

const KEY = 'grantora.entered';

/** Ommaviy sayt/ilova ochilganda:
 *  - avval kirgan foydalanuvchi bosh sahifada bo'lsa, o'z kabinetiga o'tkaziladi (seansda bir marta; keyin saytni ko'rishi mumkin);
 *  - kirmagan bo'lsa, telefonda pastda doim "Kirish" va "Ro'yxatdan o'tish" tugmalari turadi. */
export default function EntryGate() {
  const { user } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const t = useTranslations('nav');
  useEffect(() => {
    if (!user || path !== '/') return;
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === '1'; sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    if (!seen) router.replace(user.role === 'ADMIN' ? '/admin' : '/app');
  }, [user, path, router]);
  if (user !== null) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-navy/10 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgba(16,42,67,.25)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-2 gap-2 [&>a]:w-full">
        <Link href="/login" className="btn btn-ghost">{t('login')}</Link>
        <Link href="/register" className="btn btn-primary">{t('register')}</Link>
      </div>
    </div>
  );
}
