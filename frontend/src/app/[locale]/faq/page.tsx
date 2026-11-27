import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'faq' });
  return { title: t('title') };
}

/** Accordion: <details> — JavaScriptsiz ishlaydi, klaviatura va ekran o'quvchilarga mos */
export default async function Faq({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('faq');
  const n = await getTranslations('nav');
  const items = Array.from({ length: 10 }, (_, i) => i + 1);
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((i) => ({ '@type': 'Question', name: t(`q${i}`), acceptedAnswer: { '@type': 'Answer', text: t(`a${i}`) } })) };
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted"><Link href="/" className="hover:text-primary">{n('home')}</Link> / FAQ</nav>
      <h1 className="text-3xl font-extrabold">{t('title')}</h1>
      <div className="mt-6 space-y-3">
        {items.map((i) => (
          <details key={i} className="card group p-0 open:shadow-lg">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-semibold text-navy">
              {t(`q${i}`)}
              <span aria-hidden className="text-2xl leading-none text-primary transition group-open:rotate-45">+</span>
            </summary>
            <p className="px-5 pb-5 text-sm leading-relaxed text-ink/85">{t(`a${i}`)}</p>
          </details>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted"><Link href="/contact" className="font-semibold text-primary hover:underline">{n('contact')} →</Link></p>
    </div>
  );
}
