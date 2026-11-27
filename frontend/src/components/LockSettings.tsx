'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import * as lock from '@/lib/lock';
import { Modal, useL, useToast } from './admin/kit';
import PinPad from './PinPad';
import { Icon } from './ui';

type Flow = null | 'verify-change' | 'verify-remove' | 'enter' | 'confirm';

/** Xavfsizlik bo'limi: PIN-kod, barmoq izi / yuz, avtomatik qulflash vaqti. Qurilmada saqlanadi. */
export default function LockSettings() {
  const L = useL();
  const toast = useToast();
  const { user } = useAuth();
  const uid = user?.id ?? '';
  const [, bump] = useState(0);
  const re = () => bump((n) => n + 1);
  const [flow, setFlow] = useState<Flow>(null);
  const [first, setFirst] = useState('');
  const [bioOk, setBioOk] = useState(false);
  useEffect(() => { lock.bioSupported().then(setBioOk); }, []);
  const on = lock.isEnabled(uid);
  const bio = lock.bioEnabled(uid);
  const close = () => { setFlow(null); setFirst(''); };

  const verify = useCallback(async (pin: string, next: Flow | 'remove') => {
    const r = await lock.verifyPin(uid, pin);
    if (!r.ok) {
      if (r.exhausted) { lock.clearLock(uid); close(); re(); return L("Juda ko'p xato. PIN o'chirildi", 'Слишком много ошибок. PIN отключён', 'Too many attempts. PIN removed'); }
      return L(`PIN noto'g'ri. Qolgan urinish: ${r.left}`, `Неверный PIN. Осталось: ${r.left}`, `Wrong PIN. Attempts left: ${r.left}`);
    }
    if (next === 'remove') { lock.clearLock(uid); close(); re(); toast('ok', L("PIN-kod o'chirildi", 'PIN-код отключён', 'PIN removed')); } else setFlow(next);
  }, [uid, L, toast]);

  async function enter(pin: string) {
    if (lock.isWeakPin(pin)) return L('Juda oson PIN. Boshqasini tanlang', 'Слишком простой PIN', 'PIN is too easy');
    setFirst(pin); setFlow('confirm');
  }
  async function confirm(pin: string) {
    if (pin !== first) { setFirst(''); setFlow('enter'); return L('PIN-kodlar mos kelmadi', 'PIN-коды не совпали', 'PINs did not match'); }
    await lock.setPin(uid, pin);
    sessionStorage.setItem('grantora.unlocked', uid);
    close(); re(); toast('ok', L('PIN-kod yoqildi', 'PIN-код включён', 'PIN enabled'));
  }
  async function toggleBio() {
    try {
      if (bio) { lock.disableBio(uid); toast('ok', L("Barmoq izi o'chirildi", 'Отпечаток отключён', 'Fingerprint turned off')); }
      else { await lock.enableBio(uid, user?.email ?? ''); toast('ok', L('Barmoq izi / yuz yoqildi', 'Отпечаток / Face ID включён', 'Fingerprint / face enabled')); }
    } catch { toast('err', L("Yoqib bo'lmadi: qurilmada biometrika sozlanmagan yoki bekor qilindi", 'Не удалось: биометрия не настроена или отменена', 'Could not enable: biometrics not set up or cancelled')); }
    re();
  }
  const checks: [boolean, string][] = [
    [on, L('PIN-kod', 'PIN-код', 'PIN code')],
    [bio, L('Barmoq izi / yuz', 'Отпечаток / Face ID', 'Fingerprint / face')],
    [on && lock.lockAfter(uid) <= 60_000, L('Tez avtomatik qulf (1 daqiqagacha)', 'Быстрая автоблокировка (до 1 мин)', 'Fast auto-lock (up to 1 min)')],
  ];
  const score = checks.filter((c) => c[0]).length;
  const level = score >= 3 ? L('Yaxshi himoyalangan', 'Хорошо защищено', 'Well protected') : score >= 1 ? L("O'rtacha himoya", 'Средняя защита', 'Medium protection') : L('Himoya kuchsiz', 'Слабая защита', 'Weak protection');
  const row = 'flex items-center gap-3 border-b border-[#E5E7EB] py-3 last:border-0';
  const ic = 'grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary';
  const afters: [number, string][] = [[0, L('Darhol', 'Сразу', 'Immediately')], [30_000, L('30 soniya', '30 секунд', '30 seconds')], [60_000, L('1 daqiqa', '1 минута', '1 minute')], [300_000, L('5 daqiqa', '5 минут', '5 minutes')], [900_000, L('15 daqiqa', '15 минут', '15 minutes')]];
  const titles: Record<string, string> = {
    'verify-change': L('Joriy PIN-kod', 'Текущий PIN', 'Current PIN'), 'verify-remove': L("PIN-kodni o'chirish", 'Отключить PIN', 'Remove PIN'),
    enter: on ? L('Yangi PIN-kod', 'Новый PIN', 'New PIN') : L("PIN-kod o'rnatish", 'Установка PIN', 'Set up PIN'), confirm: L('PIN-kodni tasdiqlang', 'Подтвердите PIN', 'Confirm PIN'),
  };
  return (
    <div>
      <div className="mb-4 rounded-2xl bg-accent/60 p-4">
        <b className="text-base text-navy">{level} ({score}/{checks.length})</b>
        <div className="my-2 grid grid-flow-col auto-cols-fr gap-1.5">{checks.map((c, i) => <i key={i} className={`h-1.5 rounded-full ${c[0] ? 'bg-emerald-600' : 'bg-navy/15'}`} />)}</div>
        <ul className="grid gap-1 text-sm">{checks.map(([ok, l]) => <li key={l} className={`flex items-center gap-2 ${ok ? 'text-emerald-700' : 'text-amber-700'}`}><Icon name={ok ? 'check' : 'alert'} className="h-4 w-4" />{l}</li>)}</ul>
      </div>
      <p className="mb-2 text-sm text-muted">{L("Ilovani shu qurilmada himoyalaydi: telefon boshqa odamga tushsa ham hisobingiz ochilmaydi. PIN faqat shu qurilmada saqlanadi.", 'Защищает приложение на этом устройстве. PIN хранится только здесь.', 'Protects the app on this device. The PIN is stored only here.')}</p>
      <div className={row}>
        <span className={ic}><Icon name="lock" className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><b className="block text-sm text-navy">{L('PIN-kod', 'PIN-код', 'PIN code')}</b><small className="text-muted">{on ? L('Yoqilgan', 'Включён', 'On') : L("O'chiq", 'Выключен', 'Off')}</small></span>
        {on ? (
          <span className="flex gap-2"><button className="btn btn-ghost !h-9 text-xs" onClick={() => setFlow('verify-change')}>{L("O'zgartirish", 'Изменить', 'Change')}</button><button className="btn btn-ghost !h-9 text-xs !text-red-600" onClick={() => setFlow('verify-remove')}>{L("O'chirish", 'Отключить', 'Remove')}</button></span>
        ) : <button className="btn btn-primary !h-9 text-xs" onClick={() => setFlow('enter')}>{L('Yoqish', 'Включить', 'Turn on')}</button>}
      </div>
      {on && (
        <>
          <div className={row}>
            <span className={ic}><Icon name="fingerprint" className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><b className="block text-sm text-navy">{L('Barmoq izi / yuz', 'Отпечаток / Face ID', 'Fingerprint / face')}</b><small className="text-muted">{bioOk ? L('PIN o‘rniga tezkor ochish', 'Быстрая разблокировка вместо PIN', 'Quick unlock instead of PIN') : L('Bu qurilma qo‘llab-quvvatlamaydi', 'Устройство не поддерживает', 'Not supported on this device')}</small></span>
            <button role="switch" aria-checked={bio} disabled={!bioOk} onClick={toggleBio} className={`relative h-7 w-12 rounded-full transition disabled:opacity-40 ${bio ? 'bg-primary' : 'bg-navy/20'}`}><i className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${bio ? 'left-[22px]' : 'left-0.5'}`} /></button>
          </div>
          <div className={row}>
            <span className={ic}><Icon name="clock" className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><b className="block text-sm text-navy">{L('Avtomatik qulflash', 'Автоблокировка', 'Auto-lock')}</b><small className="text-muted">{L('Ilova fonda turgandan keyin', 'После пребывания в фоне', 'After the app stays in background')}</small></span>
            <select className="input !h-10 !w-auto" value={lock.lockAfter(uid)} onChange={(e) => { lock.setLockAfter(uid, Number(e.target.value)); re(); }} aria-label={L('Avtomatik qulflash', 'Автоблокировка', 'Auto-lock')}>{afters.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </div>
        </>
      )}
      <Modal open={!!flow} onClose={close} title={flow ? titles[flow] : ''}>
        {(flow === 'verify-change' || flow === 'verify-remove') && <PinPad hint={L('Davom etish uchun joriy PIN-kodni kiriting', 'Введите текущий PIN', 'Enter your current PIN')} onComplete={(p) => verify(p, flow === 'verify-remove' ? 'remove' : 'enter')} />}
        {flow === 'enter' && <PinPad hint={L(`${lock.PIN_LENGTH} xonali PIN-kod kiriting`, `Введите ${lock.PIN_LENGTH}-значный PIN`, `Enter a ${lock.PIN_LENGTH}-digit PIN`)} onComplete={enter} />}
        {flow === 'confirm' && <PinPad hint={L('PIN-kodni qayta kiriting', 'Повторите PIN', 'Enter the PIN again')} onComplete={confirm} />}
      </Modal>
    </div>
  );
}
