'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { BRAND } from '@/brand';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@/lib/client';
import LangSwitch from '../LangSwitch';
import PwaClient from '../PwaClient';
import { Icon, Spinner } from '../ui';

interface Item { href: string; key: string; icon: string; dot?: boolean }

const STUDENT: Item[] = [
  { href: '/app', key: 'overview', icon: 'home' },
  { href: '/scholarships', key: 'explore', icon: 'search' },
  { href: '/app/recommended', key: 'recommended', icon: 'star' },
  { href: '/app/saved', key: 'saved', icon: 'heart' },
  { href: '/app/applications', key: 'applications', icon: 'list' },
  { href: '/app/documents', key: 'documents', icon: 'file' },
  { href: '/app/calendar', key: 'calendar', icon: 'calendar' },
  { href: '/app/messages', key: 'messages', icon: 'msg' },
  { href: '/app/notifications', key: 'notifications', icon: 'bell', dot: true },
  { href: '/app/profile', key: 'profile', icon: 'user' },
  { href: '/app/help', key: 'help', icon: 'info' },
  { href: '/app/settings', key: 'settings', icon: 'settings' },
];
const ADMIN: Item[] = [
  { href: '/admin', key: 'a_stats', icon: 'chart' },
  { href: '/admin/scholarships', key: 'a_sch', icon: 'list' },
  { href: '/admin/users', key: 'a_users', icon: 'users' },
  { href: '/admin/reports', key: 'a_reports', icon: 'flag' },
  { href: '/admin/reviews', key: 'a_reviews', icon: 'msg' },
  { href: '/admin/messages', key: 'a_messages', icon: 'msg' },
  { href: '/admin/freshness', key: 'a_fresh', icon: 'refresh' },
  { href: '/admin/catalog', key: 'a_catalog', icon: 'globe' },
  { href: '/admin/audit', key: 'a_audit', icon: 'log' },
];
const BOTTOM: Record<'student' | 'admin', string[]> = {
  student: ['overview', 'recommended', 'applications', 'messages', 'notifications'],
  admin: ['a_stats', 'a_sch', 'a_users', 'a_reports'],
};

/**
 * Kabinet qobig'i. Kompyuterda: chap menyu. Telefonda: yuqorida menyu tugmasi (chapdan ochiladigan panel)
 * VA pastda tezkor panel — ikkalasi birga.
 */
export default function Shell({ kind, children }: { kind: 'student' | 'admin'; children: React.ReactNode }) {
  const t = useTranslations('shell');
  const a = useTranslations('auth');
  const locale = useLocale();
  const path = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const role = kind === 'admin' ? 'ADMIN' : 'STUDENT';
  const items = kind === 'admin' ? ADMIN : STUDENT;
  const { data: ov } = useQuery<{ unread: number }>(kind === 'student' && user?.role === 'STUDENT' ? `/me/overview?locale=${locale}` : null);

  useEffect(() => {
    if (user === null) router.replace('/login');
    else if (user && user.role !== role) router.replace(user.role === 'ADMIN' ? '/admin' : '/app');
  }, [user, role, router]);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);

  if (!user || user.role !== role) return <div className="grid min-h-screen place-items-center"><Spinner /></div>;

  const active = (h: string) => (h === '/app' || h === '/admin' ? path === h : path === h || path.startsWith(h + '/'));
  const bottom = BOTTOM[kind].map((k) => items.find((i) => i.key === k)!);
  const dot = (i: Item) => i.dot && (ov?.unread ?? 0) > 0;

  const NavList = ({ big = false }: { big?: boolean }) => (
    <ul className="space-y-1">
      {items.map((i) => (
        <li key={i.key}>
          <Link href={i.href} aria-current={active(i.href) ? 'page' : undefined}
            className={`relative flex items-center gap-3 rounded-xl px-3 ${big ? 'h-12' : 'h-10'} text-sm font-semibold transition ${active(i.href) ? 'bg-accent text-primary-600' : 'text-navy/80 hover:bg-canvas'}`}>
            <Icon name={i.icon} /> {t(i.key)}
            {dot(i) && <span className="ml-auto h-2 w-2 rounded-full bg-red-500" aria-label={`${ov?.unread}`} />}
          </Link>
        </li>
      ))}
    </ul>
  );
  const Foot = () => (
    <div className="space-y-3 border-t border-navy/10 p-4">
      <p className="truncate text-sm font-semibold text-navy">{user.firstName} {user.lastName}</p>
      <div className="flex gap-2">
        <Link href="/" className="btn btn-ghost h-9 flex-1 px-3 text-xs">{t('site')}</Link>
        <button className="btn btn-ghost h-9 px-3 text-xs" onClick={async () => { await logout(); router.replace('/login'); }} aria-label={a('logout')}><Icon name="logout" className="h-4 w-4" /></button>
      </div>
    </div>
  );
  const Brand = () => <Link href="/" className="font-head text-xl font-extrabold text-navy"><span className="text-primary">●</span> {BRAND.name}{kind === 'admin' && <span className="ml-2 rounded-md bg-navy px-1.5 py-0.5 align-middle text-[10px] text-white">ADMIN</span>}</Link>;

  return (
    <div className="min-h-screen bg-canvas lg:pl-64">
      {/* Kompyuter: chap menyu */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-navy/10 bg-white lg:flex">
        <div className="flex h-16 items-center px-5"><Brand /></div>
        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label={t('menu')}><NavList /></nav>
        <Foot />
      </aside>

      {/* Yuqori panel (barcha ekranlarda): menyu, qidiruv, ilovani o'rnatish, til, bildirishnoma, profil */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-navy/10 bg-white/95 px-3 backdrop-blur sm:px-6">
        <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-canvas lg:hidden" onClick={() => setOpen(true)} aria-label={t('menu')} aria-expanded={open}><Icon name="menu" /></button>
        <span className="lg:hidden"><Brand /></span>
        <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/scholarships?q=${encodeURIComponent(q.trim())}`); }} className="relative hidden min-w-0 max-w-md flex-1 md:block" role="search">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"><Icon name="search" className="h-[18px] w-[18px]" /></span>
          <input className="input !h-10 !pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} aria-label={t('search')} />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <PwaClient />
          <LangSwitch />
          <Link href="/app/notifications" className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-canvas" aria-label={t('notifications')}>
            <Icon name="bell" />{(ov?.unread ?? 0) > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{ov!.unread > 99 ? '99+' : ov!.unread}</span>}
          </Link>
          <Link href="/app/profile" className="hidden items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-canvas sm:flex" aria-label={t('profile')}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">{(user.firstName?.[0] ?? user.email[0]).toUpperCase()}</span>
            <span className="hidden max-w-[120px] truncate text-sm font-semibold text-navy xl:block">{user.firstName}</span>
          </Link>
        </div>
      </header>

      {/* Telefon: chapdan ochiladigan menyu */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t('menu')}>
          <button className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} aria-label="close" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between px-4"><Brand /><button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-canvas" onClick={() => setOpen(false)} aria-label="close"><Icon name="x" /></button></div>
            <nav className="flex-1 overflow-y-auto px-3 py-2"><NavList big /></nav>
            <Foot />
          </div>
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>

      {/* Telefon: pastki tezkor panel */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-navy/10 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Quick">
        {bottom.map((i) => (
          <Link key={i.key} href={i.href} aria-current={active(i.href) ? 'page' : undefined}
            className={`relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${active(i.href) ? 'text-primary' : 'text-muted'}`}>
            <Icon name={i.icon} className="h-5 w-5" /><span className="max-w-full truncate px-1">{t(i.key)}</span>
            {dot(i) && <span className="absolute right-[28%] top-2 h-2 w-2 rounded-full bg-red-500" />}
          </Link>
        ))}
        <button onClick={() => setOpen(true)} className="flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-muted"><Icon name="menu" className="h-5 w-5" />{t('more')}</button>
      </nav>
    </div>
  );
}
