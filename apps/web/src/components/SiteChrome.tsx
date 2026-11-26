'use client';
import { usePathname } from '@/i18n/routing';
import { BRAND } from '@/brand';
import Header from './Header';

/** Ommaviy sayt: sarlavha + pastki qism. Kabinet (/app) va admin (/admin) o'z qobig'iga ega — u yerda ko'rsatilmaydi. */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith('/app') || path.startsWith('/admin')) return <>{children}</>;
  return (
    <>
      <Header />
      <main>{children}</main>
      <footer className="mt-20 border-t border-navy/10 py-8 text-center text-sm text-muted">© {new Date().getFullYear()} {BRAND.name}</footer>
    </>
  );
}
