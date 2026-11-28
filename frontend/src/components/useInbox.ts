'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { api, useQuery } from '@/lib/client';
import { useAuth } from '@/lib/auth';
import { useL } from './admin/kit';

export type Level = 'good' | 'warn' | 'info' | 'bad';
export type Group = 'reminder' | 'message' | 'system' | 'tip';
export interface Item { key: string; src: 'server' | 'gen'; id: string; icon: string; level: Level; title: string; body: string; link: string | null; at: string | null; read: boolean; group: Group }
interface Srv { id: string; type: 'DEADLINE_REMINDER' | 'ADMIN_MESSAGE' | 'SYSTEM'; payload: any; readAt: string | null; createdAt: string; scholarship: { slug: string; tr?: { title?: string } } | null }
interface Ov { saved: number; applications: number; unread: number; documents: number; byStatus: Record<string, number>; profilePercent: number; upcoming: { id: string; slug: string; deadline: string | null; tr?: { title?: string } }[] }
export interface Prefs { sys: boolean; daily: boolean; tips: boolean }

const EVT = 'grantora:notes';
const PK = (uid: string) => `grantora.nprefs.${uid}`;
const RK = (uid: string) => `grantora.read.${uid}`;
export function getPrefs(uid: string): Prefs {
  try { return { sys: false, daily: true, tips: true, ...JSON.parse(localStorage.getItem(PK(uid)) || '{}') }; } catch { return { sys: false, daily: true, tips: true }; }
}
export function setPrefs(uid: string, p: Prefs) { try { localStorage.setItem(PK(uid), JSON.stringify(p)); } catch { /* */ } window.dispatchEvent(new Event(EVT)); }
function readSet(uid: string): Set<string> { try { return new Set<string>(JSON.parse(localStorage.getItem(RK(uid)) || '[]')); } catch { return new Set<string>(); } }
function addRead(uid: string, ids: string[]) {
  const s = readSet(uid); ids.forEach((i) => s.add(i));
  try { localStorage.setItem(RK(uid), JSON.stringify([...s].slice(-300))); } catch { /* */ }
  window.dispatchEvent(new Event(EVT));
}

/** Tizim (telefon ekrani) bildirishnomasi: ruxsat berilgan bo'lsa ko'rsatadi. */
export async function showSystem(title: string, body: string, tag = 'grantora') {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, tag, icon: '/img/logo-mark.png' });
    else new Notification(title, { body, tag, icon: '/img/logo-mark.png' });
    return true;
  } catch { return false; }
}

/** Bildirishnomalar: serverdagi xabarlar + ma'lumotlardan hosil bo'ladigan kunlik hisobot, eslatma va maslahatlar. */
export function useInbox({ list, enabled = true }: { list: boolean; enabled?: boolean }) {
  const L = useL();
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.id ?? '';
  const on = !!uid && user?.role === 'STUDENT' && enabled;
  const ov = useQuery<Ov>(on ? `/me/overview?locale=${locale}` : null);
  const srv = useQuery<Srv[]>(on && list ? '/me/notifications' : null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const f = () => setTick((n) => n + 1);
    window.addEventListener(EVT, f);
    return () => window.removeEventListener(EVT, f);
  }, []);
  const reloadOv = ov.reload;
  useEffect(() => { if (!on) return; const t = setInterval(reloadOv, 60_000); return () => clearInterval(t); }, [on, reloadOv]);

  const items = useMemo<Item[]>(() => {
    if (!on) return [];
    void tick;
    const read = readSet(uid);
    const pr = getPrefs(uid);
    const out: Item[] = [];
    const day = new Date().toISOString().slice(0, 10);
    const o = ov.data;
    const gen = (id: string, x: Omit<Item, 'key' | 'src' | 'id' | 'at' | 'read'>) => out.push({ key: `g:${id}`, src: 'gen', id, at: null, read: read.has(id), ...x });
    if (o) {
      const left = (d: string | null) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 864e5) : null);
      const titleOf = (u: Ov['upcoming'][number]) => u.tr?.title ?? u.slug;
      const next = o.upcoming.find((u) => (left(u.deadline) ?? -1) >= 0);
      if (pr.daily && (o.saved + o.applications > 0)) {
        const nd = next ? left(next.deadline) : null;
        gen(`digest:${day}`, { icon: 'chart', level: 'good', group: 'reminder', link: '/app', title: L('Kunlik hisobot', 'Ежедневный отчёт', 'Daily report'),
          body: L(`Saqlangan: ${o.saved}, arizalar: ${o.applications}.${next ? ` Eng yaqin muddat: ${titleOf(next)} (${nd} kun).` : ''}`, `Сохранено: ${o.saved}, заявок: ${o.applications}.${next ? ` Ближайший срок: ${titleOf(next)} (${nd} дн.).` : ''}`, `Saved: ${o.saved}, applications: ${o.applications}.${next ? ` Next deadline: ${titleOf(next)} (${nd} days).` : ''}`) });
      }
      if (pr.tips) {
        for (const u of o.upcoming) {
          const d = left(u.deadline);
          if (d !== null && d >= 0 && d <= 3) gen(`dl:${u.id}:${day}`, { icon: 'calendar', level: d <= 1 ? 'bad' : 'warn', group: 'reminder', link: `/app/grants/${u.slug}`, title: L('Muddat yaqinlashmoqda', 'Приближается срок', 'Deadline approaching'), body: `${titleOf(u)} · ${d === 0 ? L('bugun', 'сегодня', 'today') : L(`${d} kun qoldi`, `осталось ${d} дн.`, `${d} days left`)}` });
        }
        if (o.profilePercent < 100) gen(`profile:${o.profilePercent}`, { icon: 'user', level: 'info', group: 'tip', link: '/app/profile', title: L("Profilni to'ldiring", 'Заполните профиль', 'Complete your profile'), body: L(`Profilingiz ${o.profilePercent}% to'ldirilgan. To'liq profil bilan sizga mos grantlar aniqroq tavsiya etiladi.`, `Профиль заполнен на ${o.profilePercent}%. С полным профилем рекомендации точнее.`, `Your profile is ${o.profilePercent}% complete. A full profile gives better recommendations.`) });
        if (o.saved === 0 && o.applications === 0) gen('nosaved', { icon: 'search', level: 'info', group: 'tip', link: '/app/grants', title: L("Grantlarni ko'rib chiqing", 'Посмотрите гранты', 'Browse grants'), body: L("Hali grant saqlamadingiz. Katalogdan mosini toping va ♥ bosing.", 'Вы ещё не сохранили ни одного гранта. Найдите подходящий и нажмите ♥.', 'You have not saved any grants yet. Find one and tap ♥.') });
        if (o.documents === 0 && o.applications > 0) gen('nodocs', { icon: 'file', level: 'warn', group: 'tip', link: '/app/documents', title: L('Hujjatlarni yuklang', 'Загрузите документы', 'Upload your documents'), body: L("Arizalar kuzatilmoqda, lekin hujjat yuklanmagan. Pasport va diplomni oldindan tayyorlang.", 'Заявки отслеживаются, но документов нет. Подготовьте паспорт и диплом заранее.', 'You track applications but have no documents. Prepare your passport and diploma.') });
      }
    }
    for (const n of srv.data ?? []) {
      const p = n.payload ?? {};
      const gt = n.scholarship?.tr?.title ?? n.scholarship?.slug ?? '';
      let v: Pick<Item, 'icon' | 'level' | 'group' | 'title' | 'body' | 'link'>;
      if (n.type === 'DEADLINE_REMINDER') v = { icon: 'calendar', level: Number(p.level ?? 7) <= 1 ? 'bad' : 'warn', group: 'reminder', title: L('Muddat yaqinlashmoqda', 'Приближается срок', 'Deadline approaching'), body: `${gt}${p.level ? ` · ${p.level} ${L('kun', 'дн.', 'd')}` : ''}`, link: n.scholarship ? `/app/grants/${n.scholarship.slug}` : null };
      else if (p.kind === 'chat') v = { icon: 'msg', level: 'info', group: 'message', title: L('Administratordan yangi xabar', 'Новое сообщение от администратора', 'New message from the admin'), body: String(p.body ?? ''), link: String(p.link ?? '/app/messages') };
      else if (p.kind === 'application') {
        const st = String(p.status);
        const ttl = st === 'APPROVED' ? L('Arizangiz qabul qilindi', 'Ваша заявка одобрена', 'Your application was approved') : st === 'REJECTED' ? L('Arizangiz rad etildi', 'Ваша заявка отклонена', 'Your application was declined') : st === 'NEEDS_INFO' ? L("Arizangiz uchun ma'lumot kerak", 'Для заявки нужна информация', 'Your application needs more info') : L("Arizangiz ko'rib chiqilmoqda", 'Заявка на рассмотрении', 'Your application is under review');
        v = { icon: 'send', level: st === 'APPROVED' ? 'good' : st === 'REJECTED' ? 'bad' : st === 'NEEDS_INFO' ? 'warn' : 'info', group: 'message', title: ttl, body: `${p.title ?? ''}${p.body ? `: ${p.body}` : ''}`, link: '/app/applications' };
      }
      else if (p.kind === 'complaint') v = { icon: 'alert', level: 'good', group: 'message', title: L('Shikoyatingiz bo‘yicha javob', 'Ответ по жалобе', 'Reply to your complaint'), body: `${p.title ?? ''}${p.body ? `: ${p.body}` : ''}`, link: String(p.link ?? '/app/help?tab=complain') };
      else v = { icon: 'bell', level: 'info', group: 'system', title: String(p.title ?? L('Tizim xabari', 'Системное сообщение', 'System notice')), body: String(p.body ?? ''), link: null };
      out.push({ key: `s:${n.id}`, src: 'server', id: n.id, at: n.createdAt, read: !!n.readAt, ...v });
    }
    return out;
  }, [on, uid, ov.data, srv.data, tick, L]);

  const unread = (ov.data?.unread ?? 0) + items.filter((i) => i.src === 'gen' && !i.read).length;
  const { setData } = srv;
  const reloadSrv = srv.reload;
  const mark = useCallback(async (it: Item) => {
    if (it.read) return;
    if (it.src === 'gen') { addRead(uid, [it.id]); return; }
    setData((cur) => (cur ? cur.map((x) => (x.id === it.id ? { ...x, readAt: new Date().toISOString() } : x)) : cur));
    await api(`/me/notifications/${it.id}/read`, { method: 'POST', body: {} }).catch(() => undefined);
    reloadOv();
  }, [uid, setData, reloadOv]);
  const open = useCallback(async (it: Item) => { await mark(it); if (it.link) router.push(it.link); }, [mark, router]);
  const readAll = useCallback(async () => {
    await api('/me/notifications/read', { method: 'POST', body: {} }).catch(() => undefined);
    addRead(uid, items.filter((i) => i.src === 'gen').map((i) => i.id));
    reloadSrv(); reloadOv();
  }, [uid, items, reloadSrv, reloadOv]);
  const reload = useCallback(() => { reloadOv(); reloadSrv(); }, [reloadOv, reloadSrv]);
  return { items, unread, mark, open, readAll, reload, loading: on && list && srv.loading && !srv.data, error: srv.error };
}
