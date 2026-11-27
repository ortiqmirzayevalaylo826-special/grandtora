'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useL, useToast } from './admin/kit';
import { Icon } from './ui';
import { getPrefs, Prefs, setPrefs, showSystem } from './useInbox';

type Perm = 'granted' | 'denied' | 'default' | 'unsupported';

/** Bildirishnoma sozlamalari: telefon ekrani xabari, kunlik hisobot, eslatma va maslahatlar (shaxsiy_yordamchi'dagi kabi). */
export default function NotifSettings() {
  const L = useL();
  const toast = useToast();
  const { user } = useAuth();
  const uid = user?.id ?? '';
  const [p, setP] = useState<Prefs>({ sys: false, daily: true, tips: true });
  const [perm, setPerm] = useState<Perm>('default');
  useEffect(() => {
    if (!uid) return;
    setP(getPrefs(uid));
    setPerm(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  }, [uid]);
  const save = (n: Prefs) => { setP(n); setPrefs(uid, n); };
  async function toggleSys() {
    if (p.sys) { save({ ...p, sys: false }); return; }
    if (typeof Notification === 'undefined') { setPerm('unsupported'); return; }
    const r = perm === 'granted' ? 'granted' : await Notification.requestPermission();
    setPerm(r);
    if (r === 'granted') { save({ ...p, sys: true }); toast('ok', L('Yoqildi', 'Включено', 'Enabled')); }
    else toast('err', L('Ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering.', 'Разрешение не выдано. Разрешите в настройках браузера.', 'Permission not granted. Allow it in browser settings.'));
  }
  async function test() {
    const ok = await showSystem('Grantora', L('Bildirishnoma ishlayapti ✅', 'Уведомления работают ✅', 'Notifications are working ✅'), 'test');
    toast(ok ? 'ok' : 'err', ok ? L('Yuborildi: ekranning tepasiga qarang', 'Отправлено: смотрите вверху экрана', 'Sent: check the top of your screen') : L("Yuborib bo'lmadi", 'Не удалось отправить', 'Could not send'));
  }
  const Sw = ({ on, onClick, label, disabled }: { on: boolean; onClick: () => void; label: string; disabled?: boolean }) => (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={onClick} className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-40 ${on ? 'bg-primary' : 'bg-navy/20'}`}><i className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} /></button>
  );
  const row = (ic: string, title: string, sub: string, right: React.ReactNode) => (
    <div className="flex items-center gap-3 border-b border-[#E5E7EB] py-3 last:border-0">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary"><Icon name={ic} className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1"><b className="block text-sm text-navy">{title}</b><small className="text-muted">{sub}</small></span>{right}
    </div>
  );
  const sysOn = p.sys && perm === 'granted';
  return (
    <div>
      {perm === 'denied' && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{L('Bildirishnoma brauzer sozlamalarida bloklangan. Sayt sozlamalaridan ruxsat bering.', 'Уведомления заблокированы в браузере. Разрешите их в настройках сайта.', 'Notifications are blocked in the browser. Allow them in site settings.')}</p>}
      {perm === 'unsupported' && <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{L("Bu qurilma tizim bildirishnomasini qo'llamaydi. Xabarlar faqat qo'ng'iroqchada ko'rinadi.", 'Это устройство не поддерживает системные уведомления. Сообщения видны только в колокольчике.', 'This device does not support system notifications. Messages show only in the bell.')}</p>}
      <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">{L('Telefon / kompyuter ekrani', 'Экран телефона / компьютера', 'Phone / desktop screen')}</h3>
      {row('bell', L('Ekranda xabar chiqarish', 'Показывать на экране', 'Show on screen'), sysOn ? L('Yoqilgan: kuniga bir marta hisobot', 'Включено: отчёт раз в день', 'On: one report per day') : L("Telegram kabi tepada chiqadigan xabar", 'Всплывающее сообщение как в Telegram', 'A pop-up like Telegram'), <Sw on={sysOn} onClick={toggleSys} label="system" disabled={perm === 'unsupported'} />)}
      {sysOn && row('send', L("Sinab ko'rish", 'Проверить', 'Test'), L('Hozir test xabar yuboriladi', 'Сейчас придёт тестовое сообщение', 'Sends a test message now'), <button className="btn btn-ghost !h-9 text-xs" onClick={test}>{L('Yuborish', 'Отправить', 'Send')}</button>)}
      <h3 className="mb-1 mt-5 text-sm font-bold uppercase tracking-wide text-muted">{L('Qanday xabarlar', 'Какие уведомления', 'What to notify')}</h3>
      {row('chart', L('Kunlik hisobot', 'Ежедневный отчёт', 'Daily report'), L('Saqlangan grantlar, arizalar va eng yaqin muddat', 'Сохранённые гранты, заявки и ближайший срок', 'Saved grants, applications and the nearest deadline'), <Sw on={p.daily} onClick={() => save({ ...p, daily: !p.daily })} label="daily" />)}
      {row('alert', L('Eslatma va maslahatlar', 'Напоминания и советы', 'Reminders and tips'), L("Yaqin muddat, to'ldirilmagan profil, yuklanmagan hujjatlar", 'Близкие сроки, неполный профиль, нет документов', 'Close deadlines, incomplete profile, missing documents'), <Sw on={p.tips} onClick={() => save({ ...p, tips: !p.tips })} label="tips" />)}
      <p className="mt-3 text-xs text-muted">{L("Qo'ng'iroqcha (yuqorida) doim ishlaydi. Administrator xabarlari va shikoyat javoblari o'chirib bo'lmaydi.", 'Колокольчик работает всегда. Сообщения администратора и ответы по жалобам отключить нельзя.', 'The bell always works. Admin messages and complaint replies cannot be switched off.')}</p>
    </div>
  );
}
