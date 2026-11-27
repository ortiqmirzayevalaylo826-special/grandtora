import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { BRAND, SOCIAL } from '@/brand';
import Logo from './Logo';
import SubscribeForm from './SubscribeForm';

/** Yagona footer: barcha ochiq sahifalarda */
export default function Footer() {
  const t = useTranslations('footer');
  const n = useTranslations('nav');
  const col = 'space-y-2 text-sm text-white/75 [&_a:hover]:text-white';
  return (
    <footer className="mt-20 bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/75">{t('about')}</p>
          {SOCIAL.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Social">
              {SOCIAL.map((s) => <li key={s.name}><a href={s.href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/85 hover:bg-white/10">{s.name}</a></li>)}
            </ul>
          )}
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide !text-white">{t('pages')}</h3>
          <ul className={col}>
            <li><Link href="/">{n('home')}</Link></li>
            <li><Link href="/about">{n('about')}</Link></li>
            <li><Link href="/stories">{n('stories')}</Link></li>
            <li><Link href="/contact">{n('contact')}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide !text-white">{t('grants')}</h3>
          <ul className={col}>
            <li><Link href="/scholarships">{n('catalog')}</Link></li>
            <li><Link href="/programs">{n('programs')}</Link></li>
            <li><Link href="/countries">{n('countries')}</Link></li>
          </ul>
          <h3 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wide !text-white">{t('help')}</h3>
          <ul className={col}>
            <li><Link href="/faq">{n('faq')}</Link></li>
            <li><Link href="/privacy">{t('privacy')}</Link></li>
            <li><Link href="/terms">{t('terms')}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide !text-white">{t('subscribe')}</h3>
          <p className="mb-3 text-sm text-white/75">{t('subText')}</p>
          <SubscribeForm />
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/60">© {new Date().getFullYear()} {BRAND.name}. {t('rights')}.</div>
    </footer>
  );
}
