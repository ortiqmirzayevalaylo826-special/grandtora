'use client';
import { useEffect } from 'react';
import { usePathname } from '@/i18n/routing';
import Footer from './Footer';
import Header from './Header';

/** Ommaviy sayt: sarlavha + pastki qism. Kabinet (/app) va admin (/admin) o'z qobig'iga ega — u yerda ko'rsatilmaydi. */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  // iOS Safari viewport'dagi user-scalable=no ni hisobga olmaydi: ikki barmoq bilan yaqinlashtirishni qo'lda to'xtatamiz
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    const touch = (e: TouchEvent) => { if (e.touches.length > 1) e.preventDefault(); };
    document.addEventListener('gesturestart', stop);
    document.addEventListener('gesturechange', stop);
    document.addEventListener('touchmove', touch, { passive: false });
    return () => { document.removeEventListener('gesturestart', stop); document.removeEventListener('gesturechange', stop); document.removeEventListener('touchmove', touch); };
  }, []);
  if (path.startsWith('/app') || path.startsWith('/admin') || path === '/login' || path === '/register') return <>{children}</>;
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
