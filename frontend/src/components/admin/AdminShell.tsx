'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@/lib/client';
import LangSwitch from '@/components/LangSwitch';
import PwaClient from '@/components/PwaClient';
import { Icon, Spinner } from '@/components/ui';
import { Avatar, ToastProvider, useL } from './kit';

interface Counters { tickets: number; reviews: number; grants: number; chats: number; complaints: number }

/** Admin qobig'i: chap sidebar (planshetda faqat ikonkalar, telefonda drawer), yuqorida qidiruv, bildirishnomalar, til va profil. */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const L = useL();
  const path = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const [bell, setBell] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState('');
  const { data: cnt, reload } = useQuery<Counters>(user?.role === 'ADMIN' ? '/admin/panel/counters' : null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user === null) router.replace('/login');
    else if (user && user.role !== 'ADMIN') router.replace('/app');
  }, [user, router]);
  useEffect(() => { setDrawer(false); setBell(false); setMenu(false); }, [path]);
  useEffect(() => { const t = setInterval(reload, 60_000); return () => clearInterval(t); }, [reload]);
  useEffect(() => {
    const click = (e: MouseEvent) => { if (popRef.current && !popRef.current.contains(e.target as Node)) { setBell(false); setMenu(false); } };
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, []);
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawer]);

  if (!user || user.role !== 'ADMIN') return <div className="grid min-h-screen place-items-center"><Spinner /></div>;

  const items: { href: string; label: string; icon: string; n?: number }[] = [
    { href: '/admin', label: L('Statistika', 'Статистика', 'Statistics'), icon: 'chart' },
    { href: '/admin/scholarships', label: L('Grantlar', 'Гранты', 'Grants'), icon: 'list', n: cnt?.grants },
    { href: '/admin/users', label: L('Foydalanuvchilar', 'Пользователи', 'Users'), icon: 'users' },
    { href: '/admin/messages', label: L('Xabarlar', 'Сообщения', 'Messages'), icon: 'msg', n: cnt?.chats },
    { href: '/admin/complaints', label: L('Shikoyatlar', 'Жалобы', 'Complaints'), icon: 'alert', n: cnt?.complaints },
    { href: '/admin/reviews', label: L('Sharhlar', 'Отзывы', 'Reviews'), icon: 'star', n: cnt?.reviews },
    { href: '/admin/tickets', label: L('Murojaatlar', 'Обращения', 'Inquiries'), icon: 'inbox', n: cnt?.tickets },
    { href: '/admin/freshness', label: L('Yangilik tekshiruvi', 'Проверка актуальности', 'Freshness check'), icon: 'refresh' },
    { href: '/admin/catalog', label: L('Davlat va kategoriyalar', 'Страны и категории', 'Countries & categories'), icon: 'globe' },
    { href: '/admin/audit', label: L('Audit jurnali', 'Журнал аудита', 'Audit log'), icon: 'log' },
    { href: '/admin/guide', label: L("Qo'llanma", 'Руководство', 'Guide'), icon: 'book' },
    { href: '/admin/settings', label: L('Sozlamalar', 'Настройки', 'Settings'), icon: 'settings' },
  ];
  const active = (h: string) => (h === '/admin' ? path === h : path === h || path.startsWith(h + '/'));
  const alerts = [
    { n: cnt?.tickets ?? 0, href: '/admin/tickets', t: L('yangi murojaat', 'новых обращений', 'new inquiries'), icon: 'inbox' },
    { n: cnt?.chats ?? 0, href: '/admin/messages', t: L("o'qilmagan xabar", 'непрочитанных сообщений', 'unread messages'), icon: 'msg' },
    { n: cnt?.complaints ?? 0, href: '/admin/complaints', t: L('ochiq shikoyat', 'открытых жалоб', 'open complaints'), icon: 'alert' },
    { n: cnt?.reviews ?? 0, href: '/admin/reviews', t: L('kutilayotgan sharh', 'отзывов на проверке', 'reviews to moderate'), icon: 'star' },
    { n: cnt?.grants ?? 0, href: '/admin/scholarships?status=PENDING', t: L('tekshiruvdagi grant', 'грантов на проверке', 'grants pending review'), icon: 'list' },
  ];
  const total = alerts.reduce((a, x) => a + x.n, 0);
  const search = (e: FormEvent) => { e.preventDefault(); if (q.trim()) router.push(`/admin/scholarships?q=${encodeURIComponent(q.trim())}`); };
  const name = `${user.firstName} ${user.lastName}`.trim() || user.email;

  const Nav = ({ compact }: { compact?: boolean }) => (
    <ul className="space-y-1">
      {items.map((i) => (
        <li key={i.href}>
          <Link href={i.href} title={i.label} aria-current={active(i.href) ? 'page' : undefined}
            className={`relative flex h-11 items-center gap-3 rounded-xl text-sm font-semibold transition ${compact ? 'justify-center px-0' : 'px-3'} ${active(i.href) ? 'bg-primary text-white shadow-card' : 'text-navy/80 hover:bg-accent/60'}`}>
            <Icon name={i.icon} className="h-5 w-5 shrink-0" />
            {!compact && <span className="truncate">{i.label}</span>}
            {!!i.n && (compact
              ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
              : <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${active(i.href) ? 'bg-white/25' : 'bg-red-500 text-white'}`}>{i.n}</span>)}
          </Link>
        </li>
      ))}
    </ul>
  );
  const Brand = ({ compact }: { compact?: boolean }) => (
    <Link href="/" className="flex items-center gap-2" aria-label="Grantora">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/logo-mark.png" alt="" width={32} height={32} className="h-8 w-8" />
      {!compact && <span className="font-head text-lg font-extrabold text-navy">Grantora <span className="ml-1 rounded-md bg-primary px-1.5 py-0.5 align-middle text-[10px] font-bold text-white">ADMIN</span></span>}
    </Link>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-canvas md:pl-[72px] lg:pl-64">
        {/* sidebar: planshet — ikonkalar, kompyuter — to'liq */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-[#E5E7EB] bg-white md:flex lg:w-64">
          <div className="flex h-16 items-center justify-center px-3 lg:justify-start lg:px-5"><span className="lg:hidden"><Brand compact /></span><span className="hidden lg:block"><Brand /></span></div>
          <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Admin"><div className="lg:hidden"><Nav compact /></div><div className="hidden lg:block"><Nav /></div></nav>
          <div className="border-t border-[#E5E7EB] p-3 text-center lg:text-left">
            <Link href="/" className="btn btn-ghost !h-9 w-full !px-0 text-xs lg:!px-3" title={L('Saytga', 'На сайт', 'View site')}><Icon name="external" className="h-4 w-4" /><span className="hidden lg:inline">{L('Saytga qaytish', 'На сайт', 'Back to site')}</span></Link>
          </div>
        </aside>

        {/* yuqori panel */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-[#E5E7EB] bg-white/95 px-3 backdrop-blur sm:px-6">
          <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-canvas md:hidden" onClick={() => setDrawer(true)} aria-label="menu" aria-expanded={drawer}><Icon name="menu" /></button>
          <span className="md:hidden"><Brand compact /></span>
          <form onSubmit={search} className="relative ml-1 hidden min-w-0 max-w-md flex-1 sm:block" role="search">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"><Icon name="search" className="h-[18px] w-[18px]" /></span>
            <input className="input !h-10 !pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={L('Grant qidirish…', 'Поиск гранта…', 'Search grants…')} aria-label={L('Grant qidirish', 'Поиск гранта', 'Search grants')} />
          </form>
          <div className="ml-auto flex items-center gap-2" ref={popRef}>
            <PwaClient />
            <LangSwitch />
            <div className="relative">
              <button className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-canvas" onClick={() => { setBell((v) => !v); setMenu(false); }} aria-label={L('Bildirishnomalar', 'Уведомления', 'Notifications')} aria-expanded={bell}>
                <Icon name="bell" />{total > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{total > 99 ? '99+' : total}</span>}
              </button>
              {bell && (
                <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-2xl">
                  <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted">{L('Bildirishnomalar', 'Уведомления', 'Notifications')}</p>
                  {total === 0 ? <p className="px-3 pb-3 text-sm text-muted">{L("Yangi narsa yo'q", 'Новых нет', 'Nothing new')}</p> : alerts.filter((a) => a.n > 0).map((a) => (
                    <Link key={a.href} href={a.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-canvas"><span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-primary"><Icon name={a.icon} className="h-4 w-4" /></span><span><b>{a.n}</b> {a.t}</span></Link>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button className="flex h-10 items-center gap-2 rounded-xl px-1.5 hover:bg-canvas sm:pr-2" onClick={() => { setMenu((v) => !v); setBell(false); }} aria-expanded={menu} aria-label={L('Profil', 'Профиль', 'Profile')}>
                <Avatar name={name} /><span className="hidden max-w-[120px] truncate text-sm font-semibold sm:block">{user.firstName || 'Admin'}</span>
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-2xl">
                  <div className="px-3 py-2"><p className="truncate text-sm font-bold">{name}</p><p className="truncate text-xs text-muted">{user.email}</p><span className="mt-1 inline-block rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">ADMIN</span></div>
                  <Link href="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-canvas"><Icon name="external" className="h-4 w-4" />{L('Sayt', 'Сайт', 'Site')}</Link>
                  <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-700 hover:bg-red-50" onClick={async () => { await logout(); router.replace('/login'); }}><Icon name="logout" className="h-4 w-4" />{L('Chiqish', 'Выйти', 'Log out')}</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* telefon: chapdan ochiladigan drawer */}
        {drawer && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="menu">
            <button className="absolute inset-0 bg-navy/40" onClick={() => setDrawer(false)} aria-label="close" />
            <div className="absolute inset-y-0 left-0 flex w-72 max-w-[86%] flex-col bg-white shadow-2xl">
              <div className="flex h-16 items-center justify-between px-4"><Brand /><button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-canvas" onClick={() => setDrawer(false)} aria-label="close"><Icon name="x" /></button></div>
              <nav className="flex-1 overflow-y-auto px-3 py-2"><Nav /></nav>
              <div className="border-t border-[#E5E7EB] p-3"><Link href="/" className="btn btn-ghost w-full">{L('Saytga qaytish', 'На сайт', 'Back to site')}</Link></div>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-[1280px] px-3 pb-24 pt-5 sm:px-6 sm:pt-7 md:pb-10">{children}</main>

        {/* telefon: pastki tezkor panel */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[#E5E7EB] bg-white pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Quick">
          {[items[0], items[1], items[2], items[3]].map((i) => (
            <Link key={i.href} href={i.href} aria-current={active(i.href) ? 'page' : undefined} className={`relative flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${active(i.href) ? 'text-primary' : 'text-muted'}`}>
              <Icon name={i.icon} className="h-5 w-5" /><span className="max-w-full truncate px-1">{i.label.split(' ')[0]}</span>
              {!!i.n && <span className="absolute right-[26%] top-2 h-2 w-2 rounded-full bg-red-500" />}
            </Link>
          ))}
          <button onClick={() => setDrawer(true)} className="flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-muted"><Icon name="menu" className="h-5 w-5" />{L('Yana', 'Ещё', 'More')}</button>
        </nav>
      </div>
    </ToastProvider>
  );
}
