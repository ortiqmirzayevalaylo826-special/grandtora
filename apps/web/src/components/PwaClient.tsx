'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** Service worker ro'yxatdan o'tkazadi va "Ilovani o'rnatish" tugmasini ko'rsatadi. */
export default function PwaClient() {
  const t = useTranslations('nav');
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone) return;
    const onBip = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    window.addEventListener('beforeinstallprompt', onBip);
    // iOS Safari "beforeinstallprompt" ni qo'llamaydi — qo'lda yo'riqnoma ko'rsatamiz
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setIos(true);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  if (!evt && !ios) return null;
  return (
    <div className="relative">
      <button className="btn btn-ghost h-9 px-3 text-xs" onClick={async () => { if (evt) { await evt.prompt(); setEvt(null); } else setHint((h) => !h); }}>
        ⬇ {t('install')}
      </button>
      {hint && <p role="status" className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-navy/10 bg-white p-3 text-xs shadow-card">{t('iosHint')}</p>}
    </div>
  );
}
