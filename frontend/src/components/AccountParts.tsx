'use client';
import { FormEvent, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter, routing } from '@/i18n/routing';
import { api, ApiError, useQuery } from '@/lib/client';
import { useAuth } from '@/lib/auth';
import { Notice, Spinner, useErr } from '@/components/ui';
import { useDateFmt, useL } from '@/components/admin/kit';
import { LANG_NAMES } from '@/components/LangSwitch';
import UserAvatar from '@/components/UserAvatar';

type Msg = { kind: 'ok' | 'err'; text: string } | null;
const PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;
const Card = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
    <h2 className="text-lg font-bold text-navy">{title}</h2>
    {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

/** Profil rasmi: JPG/PNG, 2 MB gacha. */
export function AvatarUploader() {
  const L = useL();
  const err = useErr();
  const { user, setUser } = useAuth();
  const ref = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return setMsg({ kind: 'err', text: L('Rasm 2 MB dan oshmasligi kerak', 'Файл не должен превышать 2 МБ', 'The image must be under 2 MB') });
    setBusy(true); setMsg(null);
    try { const form = new FormData(); form.append('file', file); const r = await api('/me/avatar', { form }); setUser({ ...user!, ...r }); setMsg({ kind: 'ok', text: L('Rasm yangilandi', 'Фото обновлено', 'Photo updated') }); }
    catch (x) { setMsg({ kind: 'err', text: err((x as ApiError).code) }); } finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  }
  async function remove() {
    setBusy(true); setMsg(null);
    try { const r = await api('/me/avatar', { method: 'DELETE' }); setUser({ ...user!, ...r }); setMsg({ kind: 'ok', text: L("Rasm o'chirildi", 'Фото удалено', 'Photo removed') }); } catch (x) { setMsg({ kind: 'err', text: err((x as ApiError).code) }); } finally { setBusy(false); }
  }
  return (
    <div className="flex flex-wrap items-center gap-5">
      <UserAvatar user={user} size="h-24 w-24 text-3xl" />
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => ref.current?.click()}>{busy ? '…' : L('Rasm yuklash', 'Загрузить фото', 'Upload photo')}</button>
          {user.avatar && <button type="button" className="btn btn-ghost" disabled={busy} onClick={remove}>{L("O'chirish", 'Удалить', 'Remove')}</button>}
        </div>
        <p className="text-xs text-muted">{L('JPG yoki PNG, 2 MB gacha', 'JPG или PNG, до 2 МБ', 'JPG or PNG, up to 2 MB')}</p>
        <input ref={ref} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => upload(e.target.files?.[0])} aria-label={L('Rasm tanlash', 'Выбор фото', 'Choose photo')} />
        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      </div>
    </div>
  );
}

/** Ism, familiya va afzal til. */
export function NameLangForm() {
  const L = useL();
  const err = useErr();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', locale: (user?.locale ?? locale) as string });
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  async function save(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      const r = await api('/me/account', { method: 'PATCH', body: f });
      setUser({ ...user!, ...r }); setMsg({ kind: 'ok', text: L('Saqlandi', 'Сохранено', 'Saved') });
      if (f.locale !== locale) router.replace(pathname, { locale: f.locale as (typeof routing.locales)[number] });
    } catch (x) { setMsg({ kind: 'err', text: err((x as ApiError).code) }); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-semibold">{L('Ism', 'Имя', 'First name')}<input className="input mt-1" required maxLength={60} value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} autoComplete="given-name" /></label>
      <label className="block text-sm font-semibold">{L('Familiya', 'Фамилия', 'Last name')}<input className="input mt-1" maxLength={60} value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} autoComplete="family-name" /></label>
      <label className="block text-sm font-semibold">Email<input className="input mt-1 bg-slate-50" value={user.email} readOnly aria-readonly /></label>
      <label className="block text-sm font-semibold">{L('Til (interfeys va email xatlari)', 'Язык (интерфейс и письма)', 'Language (interface and emails)')}
        <select className="input mt-1" value={f.locale} onChange={(e) => setF({ ...f, locale: e.target.value })}>{routing.locales.map((l) => <option key={l} value={l}>{LANG_NAMES[l] ?? l}</option>)}</select></label>
      {msg && <div className="sm:col-span-2"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      <div className="sm:col-span-2"><button className="btn btn-primary" disabled={busy}>{busy ? '…' : L('Saqlash', 'Сохранить', 'Save')}</button></div>
    </form>
  );
}

export function PasswordForm() {
  const L = useL();
  const err = useErr();
  const [pw, setPw] = useState({ current: '', next: '', again: '' });
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  async function change(e: FormEvent) {
    e.preventDefault(); setMsg(null);
    if (!PW.test(pw.next)) return setMsg({ kind: 'err', text: err('weak_password') });
    if (pw.next !== pw.again) return setMsg({ kind: 'err', text: L('Yangi parollar mos kelmadi', 'Новые пароли не совпадают', 'New passwords do not match') });
    setBusy(true);
    try { await api('/me/password', { body: { current: pw.current, next: pw.next } }); setPw({ current: '', next: '', again: '' }); setMsg({ kind: 'ok', text: L("Parol o'zgartirildi. Boshqa qurilmalardan chiqarildi.", 'Пароль изменён. Другие устройства отключены.', 'Password changed. Other devices were signed out.') }); }
    catch (x) { setMsg({ kind: 'err', text: err((x as ApiError).code) }); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={change} className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-semibold sm:col-span-2">{L('Joriy parol', 'Текущий пароль', 'Current password')}<input className="input mt-1" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></label>
      <label className="block text-sm font-semibold">{L('Yangi parol', 'Новый пароль', 'New password')}<input className="input mt-1" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></label>
      <label className="block text-sm font-semibold">{L('Yangi parolni takrorlang', 'Повторите новый пароль', 'Repeat new password')}<input className="input mt-1" type="password" autoComplete="new-password" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} required /></label>
      <p className="text-xs text-muted sm:col-span-2">{L('Kamida 8 belgi: katta va kichik harf, raqam va belgi.', 'Минимум 8 символов: заглавные и строчные буквы, цифра и символ.', 'At least 8 characters with upper and lower case, a digit and a symbol.')}</p>
      {msg && <div className="sm:col-span-2"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      <div className="sm:col-span-2"><button className="btn btn-primary" disabled={busy}>{busy ? '…' : L("Parolni o'zgartirish", 'Сменить пароль', 'Change password')}</button></div>
    </form>
  );
}

/** Faol qurilmalar (sessiyalar): alohida yoki barchasidan chiqish. */
export function SessionsList() {
  const L = useL();
  const f = useDateFmt();
  const router = useRouter();
  const { setUser } = useAuth();
  const { data, error, loading, reload } = useQuery<{ id: string; userAgent: string | null; createdAt: string }[]>('/me/sessions');
  const [msg, setMsg] = useState<Msg>(null);
  const dev = (ua: string | null) => {
    const s = ua ?? '';
    const os = /Windows/i.test(s) ? 'Windows' : /Android/i.test(s) ? 'Android' : /iPhone|iPad/i.test(s) ? 'iOS' : /Mac OS/i.test(s) ? 'macOS' : /Linux/i.test(s) ? 'Linux' : L('Noma’lum qurilma', 'Неизвестное устройство', 'Unknown device');
    const br = /Edg\//.test(s) ? 'Edge' : /OPR\//.test(s) ? 'Opera' : /Chrome\//.test(s) ? 'Chrome' : /Firefox\//.test(s) ? 'Firefox' : /Safari\//.test(s) ? 'Safari' : '';
    return `${os}${br ? ` · ${br}` : ''}`;
  };
  async function end(id: string) { try { await api(`/me/sessions/${id}`, { method: 'DELETE' }); reload(); } catch { setMsg({ kind: 'err', text: L('Bajarilmadi', 'Не выполнено', 'Failed') }); } }
  async function endAll() {
    if (!confirm(L('Barcha qurilmalardan, shu jumladan bundan ham chiqasiz. Davom etamizmi?', 'Вы выйдете со всех устройств, включая это. Продолжить?', 'You will be signed out everywhere, including here. Continue?'))) return;
    try { await api('/me/sessions', { method: 'DELETE' }); setUser(null); router.replace('/login'); } catch { setMsg({ kind: 'err', text: L('Bajarilmadi', 'Не выполнено', 'Failed') }); }
  }
  if (loading && !data) return <Spinner />;
  if (error || !data) return <Notice kind="err">{L('Yuklanmadi', 'Не загружено', 'Failed to load')}</Notice>;
  return (
    <div className="space-y-3">
      {data.length === 0 ? <p className="text-sm text-muted">—</p> : (
        <ul className="divide-y divide-[#E5E7EB]">{data.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-navy">{dev(s.userAgent)}{i === 0 && <span className="ml-2 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-primary">{L('Eng so‘nggi', 'Последняя', 'Latest')}</span>}</p><p className="text-xs text-muted">{f.dt(s.createdAt)}</p></div>
            <button className="btn btn-ghost !h-9 text-xs" onClick={() => end(s.id)}>{L('Chiqarish', 'Завершить', 'Sign out')}</button>
          </li>
        ))}</ul>
      )}
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <button className="btn btn-ghost" onClick={endAll}>{L('Barcha qurilmalardan chiqish', 'Выйти на всех устройствах', 'Sign out everywhere')}</button>
    </div>
  );
}

/** Shaxsiy ma'lumotlarni JSON ko'rinishida yuklab olish. */
export function ExportData() {
  const L = useL();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  async function go() {
    setBusy(true); setMsg(null);
    try {
      const j = await api('/me/export');
      const url = URL.createObjectURL(new Blob([JSON.stringify(j, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'grantora-data.json'; a.click(); URL.revokeObjectURL(url);
    } catch { setMsg({ kind: 'err', text: L('Yuklab bo‘lmadi', 'Не удалось скачать', 'Download failed') }); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-3">
      <button className="btn btn-ghost" disabled={busy} onClick={go}>{busy ? '…' : L("Ma'lumotlarimni yuklab olish (JSON)", 'Скачать мои данные (JSON)', 'Download my data (JSON)')}</button>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
    </div>
  );
}

export function DeleteAccount() {
  const L = useL();
  const err = useErr();
  const router = useRouter();
  const { setUser } = useAuth();
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState<Msg>(null);
  async function remove(e: FormEvent) {
    e.preventDefault(); setMsg(null);
    if (!confirm(L("Hisob va barcha ma'lumotlar butunlay o'chiriladi. Davom etamizmi?", 'Аккаунт и все данные будут удалены безвозвратно. Продолжить?', 'Your account and all data will be permanently deleted. Continue?'))) return;
    try { await api('/me', { method: 'DELETE', body: { password: pw } }); setUser(null); router.replace('/'); } catch (x) { setMsg({ kind: 'err', text: err((x as ApiError).code) }); }
  }
  return (
    <form onSubmit={remove} className="space-y-3">
      <p className="text-sm text-muted">{L("Hisob, profil, hujjatlar va arizalar butunlay o'chadi. Tasdiqlash uchun parolni kiriting.", 'Аккаунт, профиль, документы и заявки будут удалены. Введите пароль для подтверждения.', 'Your account, profile, documents and applications will be deleted. Enter your password to confirm.')}</p>
      <input className="input max-w-sm" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} aria-label={L('Parol', 'Пароль', 'Password')} required />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <button className="btn bg-red-600 text-white hover:bg-red-700">{L("Hisobni o'chirish", 'Удалить аккаунт', 'Delete account')}</button>
    </form>
  );
}

export { Card as SettingsCard };
