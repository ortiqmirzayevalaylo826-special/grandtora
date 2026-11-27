'use client';
import { useEffect, useState } from 'react';
import { useL } from './admin/kit';

export default function OfflineBar() {
  const L = useL();
  const [off, setOff] = useState(false);
  useEffect(() => {
    setOff(!navigator.onLine);
    const a = () => setOff(true), b = () => setOff(false);
    window.addEventListener('offline', a); window.addEventListener('online', b);
    return () => { window.removeEventListener('offline', a); window.removeEventListener('online', b); };
  }, []);
  if (!off) return null;
  return <div role="status" className="sticky top-0 z-40 bg-amber-800 px-3 py-1.5 text-center text-sm font-semibold text-white">{L("Internet yo'q: ma'lumotlar saqlanmaydi", 'Нет интернета: данные не сохраняются', 'You are offline: changes are not saved')}</div>;
}
