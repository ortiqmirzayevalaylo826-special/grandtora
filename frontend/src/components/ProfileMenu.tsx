'use client';
import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import { useL } from './admin/kit';
import LangSwitch from './LangSwitch';
import PwaClient from './PwaClient';
import UserAvatar from './UserAvatar';
import { Icon } from './ui';

/** Profil tugmasi: bosilganda menyu ochiladi — profil, sozlamalar, til, ilovani o'rnatish va chiqish. */
export default function ProfileMenu({ profileHref, settingsHref, admin = false }: { profileHref: string; settingsHref: string; admin?: boolean }) {
  const L = useL();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent | TouchEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', down); document.addEventListener('touchstart', down); window.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('touchstart', down); window.removeEventListener('keydown', key); };
  }, [open]);
  if (!user) return null;
  const name = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const row = 'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-navy hover:bg-canvas';
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="flex h-10 items-center gap-2 rounded-xl px-1 hover:bg-canvas sm:pr-2" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu" aria-label={L('Profil', 'Профиль', 'Profile')}>
        <UserAvatar user={user} />
        <span className="hidden max-w-[110px] truncate text-sm font-semibold text-navy xl:block">{user.firstName || 'Admin'}</span>
        <Icon name="chevron" className={`hidden h-4 w-4 text-muted transition sm:block ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-navy/10 bg-white p-2 shadow-2xl">
          <Link href={profileHref} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-canvas">
            <UserAvatar user={user} />
            <span className="min-w-0"><span className="block truncate text-sm font-bold text-navy">{name}</span><span className="block truncate text-xs text-muted">{user.email}</span></span>
          </Link>
          <div className="my-1 border-t border-navy/10" />
          <Link href={profileHref} className={row} role="menuitem"><Icon name="user" className="h-5 w-5 text-muted" />{L('Mening profilim', 'Мой профиль', 'My profile')}</Link>
          <Link href={settingsHref} className={row} role="menuitem"><Icon name="settings" className="h-5 w-5 text-muted" />{L('Sozlamalar', 'Настройки', 'Settings')}</Link>
          {!admin && <Link href="/app/help" className={row} role="menuitem"><Icon name="info" className="h-5 w-5 text-muted" />{L("Yordam va qo'llanma", 'Помощь и руководство', 'Help & guide')}</Link>}
          <Link href="/" className={row} role="menuitem"><Icon name="external" className="h-5 w-5 text-muted" />{L('Saytga qaytish', 'На сайт', 'Back to site')}</Link>
          {/* Telefonda til va o'rnatish tugmalari shu yerda (yuqori panelda joy tor) */}
          <div className="space-y-2 px-1 py-2 md:hidden"><LangSwitch className="w-full" /><PwaClient full /></div>
          <div className="my-1 border-t border-navy/10" />
          <button type="button" role="menuitem" className={`${row} w-full text-red-700 hover:!bg-red-50`} onClick={async () => { setOpen(false); await logout(); router.replace('/login'); }}><Icon name="logout" className="h-5 w-5" />{L('Chiqish', 'Выйти', 'Log out')}</button>
        </div>
      )}
    </div>
  );
}
