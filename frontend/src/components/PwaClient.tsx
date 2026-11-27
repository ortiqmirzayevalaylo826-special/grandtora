'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from './ui';

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** Service worker ro'yxatdan o'tkazadi. "Ilovani o'rnatish" tugmasi HAR DOIM ko'rinadi (ilova allaqachon o'rnatilgan bo'lsa — yo'q).
 *  Brauzer o'rnatish oynasini bersa — to'g'ridan-to'g'ri ochiladi, bo'lmasa (iOS, Firefox...) qisqa yo'riqnoma chiqadi. */
export default function PwaClient({ className = '' }: { className?: string }) {
  const t = useTranslations('nav');
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone) { setInstalled(true); return; }
    const onBip = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    const onInst = () => { setInstalled(true); setEvt(null); };
    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInst);
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setIos(true);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInst); };
  }, []);
  useEffect(() => {
    if (!hint) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setHint(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [hint]);

  if (installed) return null;
  return (
    <div className={`relative ${className}`}>
      <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/30 bg-accent px-3 text-sm font-semibold text-primary hover:bg-primary hover:text-white" aria-label={t('install')} title={t('install')}
        onClick={async () => { if (evt) { await evt.prompt(); setEvt(null); } else setHint((h) => !h); }}>
        <Icon name="download" className="h-[18px] w-[18px]" /><span className="hidden whitespace-nowrap md:inline">{t('install')}</span>
      </button>
      {hint && <p role="status" className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-navy/10 bg-white p-3 text-xs leading-relaxed text-navy shadow-card">{ios ? t('iosHint') : t('installHint')}</p>}
    </div>
  );
}
