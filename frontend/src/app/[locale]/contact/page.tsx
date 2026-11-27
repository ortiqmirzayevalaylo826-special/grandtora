import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { CONTACT, SOCIAL } from '@/brand';
import ContactForm from '@/components/ContactForm';
import { Icon } from '@/components/ui';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: t('title'), description: t('sub') };
}

export default async function Contact({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const n = await getTranslations('nav');
  const rows = [
    { i: 'msg', l: t('email'), v: CONTACT.email, href: CONTACT.email ? `mailto:${CONTACT.email}` : '' },
    { i: 'bell', l: t('phone'), v: CONTACT.phone, href: CONTACT.phone ? `tel:${CONTACT.phone.replace(/\s/g, '')}` : '' },
    { i: 'flag', l: t('address'), v: CONTACT.address, href: '' },
  ].filter((r) => r.v);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-2 text-xs text-muted"><Link href="/" className="hover:text-primary">{n('home')}</Link> / {n('contact')}</nav>
      <h1 className="text-3xl font-extrabold">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t('sub')}</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          {rows.length > 0 ? rows.map((r) => (
            <div key={r.l} className="card flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-primary"><Icon name={r.i} /></span>
              <div><p className="text-xs font-bold uppercase tracking-wide text-muted">{r.l}</p>{r.href ? <a href={r.href} className="font-semibold text-navy hover:text-primary">{r.v}</a> : <p className="font-semibold text-navy">{r.v}</p>}</div>
            </div>
          )) : <div className="card p-5 text-sm text-muted">{t('noInfo')}</div>}
          {SOCIAL.length > 0 && (
            <div className="card p-5"><p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">{t('social')}</p>
              <ul className="flex flex-wrap gap-2">{SOCIAL.map((s) => <li key={s.name}><a href={s.href} target="_blank" rel="noopener noreferrer" className="btn btn-ghost h-9 px-3 text-xs">{s.name}</a></li>)}</ul>
            </div>
          )}
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
