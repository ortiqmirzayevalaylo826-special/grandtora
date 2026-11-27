'use client';
import { usePathname } from '@/i18n/routing';
import Footer from './Footer';
import Header from './Header';

/** Ommaviy sayt: sarlavha + pastki qism. Kabinet (/app) va admin (/admin) o'z qobig'iga ega — u yerda ko'rsatilmaydi. */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith('/app') || path.startsWith('/admin') || path === '/login' || path === '/register') return <>{children}</>;
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
