'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/client';
import { useAuth } from '@/lib/auth';
import { Icon } from './ui';

// Saqlanganlar ro'yxati bir marta yuklanadi va barcha kartalar o'rtasida bo'lishiladi
let ids: Set<string> | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());
function load() {
  if (ids) return Promise.resolve();
  if (!loading) loading = api<{ saved: string[] }>('/me/ids').then((r) => { ids = new Set(r.saved); }).catch(() => { ids = new Set(); }).finally(() => { loading = null; notify(); });
  return loading;
}

/** Yurakcha: sevimlilarga qo'shish. Kirmagan foydalanuvchi uchun — kirish sahifasiga havola. */
export default function SaveButton({ id }: { id: string }) {
  const t = useTranslations('card');
  const { user } = useAuth();
  const [, force] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    listeners.add(f);
    if (user?.role === 'STUDENT') load();
    return () => { listeners.delete(f); };
  }, [user]);

  if (user === undefined || user?.role === 'ADMIN') return null;
  const base = 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-navy/10 bg-white text-navy/60 transition hover:text-red-500';
  if (user === null) return <Link href="/login" aria-label={t('loginToSave')} title={t('loginToSave')} className={base}><Icon name="heart" className="h-[18px] w-[18px]" /></Link>;
  const on = !!ids?.has(id);
  return (
    <button type="button" disabled={busy} aria-pressed={on} aria-label={on ? t('saved') : t('save')} title={on ? t('saved') : t('save')}
      className={`${base} ${on ? '!text-red-500' : ''}`}
      onClick={async () => {
        setBusy(true);
        try {
          await api(`/me/saved/${id}`, { method: on ? 'DELETE' : 'PUT' });
          if (!ids) ids = new Set();
          on ? ids.delete(id) : ids.add(id);
          notify();
        } finally { setBusy(false); }
      }}>
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  );
}
