import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { BRAND } from '@/brand';
import SiteChrome from '@/components/SiteChrome';
import { AuthProvider } from '@/lib/auth';
import '../globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });
const head = Manrope({ subsets: ['latin', 'cyrillic'], variable: '--font-head', weight: ['600', '700', '800'] });

export const metadata: Metadata = { title: { default: BRAND.name, template: `%s — ${BRAND.name}` }, description: 'Scholarships and grants from around the world', icons: { icon: '/icons/icon.svg', apple: '/icons/icon-192.png' }, appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: 'default' } };
export const viewport = { themeColor: '#087F5B', width: 'device-width', initialScale: 1 };
export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale} className={`${inter.variable} ${head.variable}`}>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <SiteChrome>{children}</SiteChrome>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
