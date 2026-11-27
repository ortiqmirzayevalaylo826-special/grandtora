'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PIN_LENGTH } from '@/lib/lock';
import { Icon } from './ui';

/** PIN klaviaturasi. onComplete xato matnini qaytarsa — nuqtalar silkinadi va tozalanadi. */
export default function PinPad({ onComplete, onBio, hint, dark = false }: { onComplete: (pin: string) => Promise<string | void>; onBio?: () => void; hint?: string; dark?: boolean }) {
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);
  const cur = useRef('');
  const busy = useRef(false);
  const press = useCallback(async (k: string) => {
    if (busy.current) return;
    if (k === 'back') { cur.current = cur.current.slice(0, -1); setVal(cur.current); setErr(''); return; }
    if (!/^\d$/.test(k) || cur.current.length >= PIN_LENGTH) return;
    cur.current += k;
    setVal(cur.current);
    if (cur.current.length < PIN_LENGTH) return;
    busy.current = true;
    const entered = cur.current;
    try {
      const m = (await onComplete(entered)) as string | undefined;
      cur.current = ''; setVal(''); setErr(m || '');
      if (m) { setShake(true); setTimeout(() => setShake(false), 450); }
    } finally { busy.current = false; }
  }, [onComplete]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('back'); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [press]);
  const btn = `grid h-16 w-16 place-items-center rounded-full text-2xl font-semibold transition active:scale-95 ${dark ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-canvas text-navy hover:bg-accent'}`;
  return (
    <div className="mx-auto w-full max-w-[280px] text-center">
      {hint && <p className={`mb-4 text-sm ${dark ? 'text-white/85' : 'text-muted'}`}>{hint}</p>}
      <div className={`mb-3 flex justify-center gap-4 ${shake ? 'animate-[pinshake_.4s]' : ''}`} aria-live="polite">
        {Array.from({ length: PIN_LENGTH }, (_, i) => <i key={i} className={`h-3.5 w-3.5 rounded-full border-2 transition ${i < val.length ? (dark ? 'border-white bg-white' : 'border-primary bg-primary') : (dark ? 'border-white/60' : 'border-navy/30')}`} />)}
      </div>
      <p role="alert" className={`mb-3 min-h-5 text-sm font-semibold ${dark ? 'text-red-200' : 'text-red-600'}`}>{err}</p>
      <div className="grid grid-cols-3 justify-items-center gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => <button key={k} type="button" className={btn} onClick={() => press(k)}>{k}</button>)}
        {onBio ? <button type="button" className={btn} onClick={onBio} aria-label="Fingerprint"><Icon name="fingerprint" className="h-7 w-7" /></button> : <span />}
        <button type="button" className={btn} onClick={() => press('0')}>0</button>
        <button type="button" className={btn} onClick={() => press('back')} aria-label="Backspace"><Icon name="x" className="h-6 w-6" /></button>
      </div>
    </div>
  );
}
