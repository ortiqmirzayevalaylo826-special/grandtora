import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';

/** privacy va terms sahifalari uchun umumiy ko'rinish */
export async function LegalPage({ locale, kind }: { locale: string; kind: 'privacy' | 'terms' }) {
  setRequestLocale(locale);
  const t = await getTranslations('legal');
  const n = await getTranslations('nav');
  const ps = [1, 2, 3, 4, 5];
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted"><Link href="/" className="hover:text-primary">{n('home')}</Link> / {t(`${kind}Title`)}</nav>
      <h1 className="text-3xl font-extrabold">{t(`${kind}Title`)}</h1>
      <div className="mt-6 space-y-4 text-ink/85">{ps.map((i) => <p key={i} className="leading-relaxed">{t(`${kind}P${i}`)}</p>)}</div>
    </div>
  );
}
export async function legalMeta(locale: string, kind: 'privacy' | 'terms') {
  const t = await getTranslations({ locale, namespace: 'legal' });
  return { title: t(`${kind}Title`) };
}
