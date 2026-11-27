'use client';
import { FormEvent, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { api, ApiError } from '@/lib/client';
import { useAuth } from '@/lib/auth';
import { useErr } from '@/components/ui';
import { Avatar, PageTitle, Panel, useL, useToast } from '@/components/admin/kit';
import LangSwitch, { LANG_NAMES } from '@/components/LangSwitch';
import PwaClient from '@/components/PwaClient';

const PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

export default function AdminSettings() {
  const L = useL();
  const err = useErr();
  const toast = useToast();
  const router = useRouter();
  const locale = useLocale();
  const { user, logout } = useAuth();
  const [pw, setPw] = useState({ current: '', next: '', again: '' });
  const [busy, setBusy] = useState(false);
  const name = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : '';

  async function change(e: FormEvent) {
    e.preventDefault();
    if (!PW.test(pw.next)) return toast('err', err('weak_password'));
    if (pw.next !== pw.again) return toast('err', L('Yangi parollar mos kelmadi', 'Новые пароли не совпадают', 'New passwords do not match'));
    setBusy(true);
    try { await api('/me/password', { body: { current: pw.current, next: pw.next } }); setPw({ current: '', next: '', again: '' }); toast('ok', L("Parol o'zgartirildi", 'Пароль изменён', 'Password changed')); } catch (x) { toast('err', err((x as ApiError).code)); } finally { setBusy(false); }
  }
  return (
    <div className="max-w-3xl">
      <PageTitle title={L('Sozlamalar', 'Настройки', 'Settings')} />
      <div className="space-y-5">
        <Panel title={L('Profil', 'Профиль', 'Profile')}>
          <div className="flex items-center gap-4"><Avatar name={name} size="h-14 w-14 text-lg" /><div className="min-w-0"><p className="truncate font-bold">{name}</p><p className="truncate text-sm text-muted">{user?.email}</p><span className="mt-1 inline-block rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">ADMIN</span></div></div>
        </Panel>
        <Panel title={L('Til va ilova', 'Язык и приложение', 'Language & app')}>
          <div className="flex flex-wrap items-center gap-3"><LangSwitch /><PwaClient /></div>
          <p className="mt-3 text-xs text-muted">{L(`Joriy til: ${LANG_NAMES[locale] ?? locale}. Tanlov butun saytga qo'llanadi.`, `Текущий язык: ${LANG_NAMES[locale] ?? locale}. Выбор применяется ко всему сайту.`, `Current language: ${LANG_NAMES[locale] ?? locale}. The choice applies site-wide.`)}</p>
        </Panel>
        <Panel title={L("Parolni o'zgartirish", 'Смена пароля', 'Change password')}>
          <form onSubmit={change} className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold sm:col-span-2">{L('Joriy parol', 'Текущий пароль', 'Current password')}<input className="input mt-1" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></label>
            <label className="block text-sm font-semibold">{L('Yangi parol', 'Новый пароль', 'New password')}<input className="input mt-1" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></label>
            <label className="block text-sm font-semibold">{L('Yangi parolni takrorlang', 'Повторите новый пароль', 'Repeat new password')}<input className="input mt-1" type="password" autoComplete="new-password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} required /></label>
            <p className="text-xs text-muted sm:col-span-2">{L("Kamida 8 belgi: katta va kichik harf, raqam va belgi.", 'Минимум 8 символов: заглавные и строчные буквы, цифра и символ.', 'At least 8 characters with upper and lower case, a digit and a symbol.')}</p>
            <div className="sm:col-span-2"><button className="btn btn-primary" disabled={busy}>{busy ? '…' : L('Saqlash', 'Сохранить', 'Save')}</button></div>
          </form>
        </Panel>
        <Panel title={L('Seans', 'Сеанс', 'Session')}>
          <button className="btn btn-ghost" onClick={async () => { await logout(); router.replace('/login'); }}>{L('Chiqish', 'Выйти', 'Log out')}</button>
        </Panel>
      </div>
    </div>
  );
}
