'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/lib/auth';
import * as lock from '@/lib/lock';
import { useL } from './admin/kit';
import PinPad from './PinPad';
import LockSettings from './LockSettings';
import { Modal } from './admin/kit';

const FLAG = 'grantora.unlocked';

/** Ilova qulfi: PIN yoqilgan bo'lsa, ilova yangi ochilganda yoki fonda belgilangan vaqtdan ortiq turib qaytganda PIN (yoki barmoq izi) so'raydi. */
export default function LockGate({ children }: { children: React.ReactNode }) {
  const L = useL();
  const router = useRouter();
  const { user, logout } = useAuth();
  const uid = user?.id;
  const [locked, setLocked] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const hiddenAt = useRef(0);
  const [ask, setAsk] = useState(false);
  useEffect(() => {
    if (!uid || locked) return;
    try { if (lock.isEnabled(uid) || localStorage.getItem(`grantora.secAsk.${uid}`)) return; } catch { return; }
    const t = setTimeout(() => setAsk(true), 1500);
    return () => clearTimeout(t);
  }, [uid, locked]);
  const later = () => { try { if (uid) localStorage.setItem(`grantora.secAsk.${uid}`, '1'); } catch { /* */ } setAsk(false); };

  useEffect(() => {
    if (uid && lock.isEnabled(uid) && sessionStorage.getItem(FLAG) !== uid) setLocked(true);
  }, [uid]);
  useEffect(() => {
    if (!uid) return;
    const vis = () => {
      if (!lock.isEnabled(uid)) return;
      const after = lock.lockAfter(uid);
      if (document.hidden) { hiddenAt.current = Date.now(); if (after === 0) { sessionStorage.removeItem(FLAG); setLocked(true); } }
      else if (hiddenAt.current && Date.now() - hiddenAt.current >= after) { sessionStorage.removeItem(FLAG); setLocked(true); }
    };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, [uid]);

  const unlock = useCallback(() => { if (uid) sessionStorage.setItem(FLAG, uid); setLocked(false); setLeft(null); }, [uid]);
  const bio = useCallback(async () => { if (uid && (await lock.bioUnlock(uid))) unlock(); }, [uid, unlock]);
  useEffect(() => { if (locked && uid && lock.bioEnabled(uid)) { const t = setTimeout(bio, 350); return () => clearTimeout(t); } }, [locked, uid, bio]);

  const onPin = useCallback(async (pin: string) => {
    if (!uid) return;
    const r = await lock.verifyPin(uid, pin);
    if (r.ok) { unlock(); return; }
    if (r.exhausted) { lock.clearLock(uid); sessionStorage.removeItem(FLAG); await logout(); router.replace('/login'); return; }
    setLeft(r.left);
    return L("PIN noto'g'ri", 'Неверный PIN', 'Wrong PIN');
  }, [uid, unlock, logout, router, L]);

  if (!locked || !uid) return (
    <>
      {children}
      <Modal open={ask} onClose={later} title={L('Hisobingizni himoyalang', 'Защитите аккаунт', 'Protect your account')} footer={<button className="btn btn-ghost" onClick={later}>{L('Keyinroq', 'Позже', 'Later')}</button>}>
        <LockSettings />
      </Modal>
    </>
  );
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-[#064E3B] to-[#087F5B] px-6 py-10 text-white" role="dialog" aria-modal="true" aria-label={L('Ilova qulflangan', 'Приложение заблокировано', 'App locked')}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/logo-mark.png" alt="" width={64} height={64} className="mb-3 h-16 w-16 rounded-2xl bg-white/95 p-1.5" />
      <h1 className="mb-1 font-head text-2xl font-extrabold !text-white">Grantora</h1>
      <p className="mb-6 text-sm text-white/80">{user?.email}</p>
      <PinPad dark hint={left !== null ? L(`Qolgan urinish: ${left}`, `Осталось попыток: ${left}`, `Attempts left: ${left}`) : L('PIN-kodni kiriting', 'Введите PIN-код', 'Enter your PIN')} onComplete={onPin} onBio={lock.bioEnabled(uid) ? bio : undefined} />
      <button type="button" className="mt-6 text-sm font-semibold text-white/90 underline" onClick={async () => { lock.clearLock(uid); sessionStorage.removeItem(FLAG); await logout(); router.replace('/login'); }}>
        {L('PIN esdan chiqdimi? Parol bilan kirish', 'Забыли PIN? Войти по паролю', 'Forgot PIN? Sign in with password')}
      </button>
    </div>
  );
}
