'use client';
import { useEffect, useRef } from 'react';

/** Telefondagi "Orqaga" tugmasi ochiq menyu/oynani yopsin (sahifadan chiqib ketmasin). */
export function useBackClose(open: boolean, close: () => void) {
  const cb = useRef(close);
  cb.current = close;
  useEffect(() => {
    if (!open) return;
    let popped = false;
    history.pushState({ ov: 1 }, '');
    const onPop = () => { popped = true; cb.current(); };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!popped && history.state && (history.state as { ov?: number }).ov) history.back();
    };
  }, [open]);
}
