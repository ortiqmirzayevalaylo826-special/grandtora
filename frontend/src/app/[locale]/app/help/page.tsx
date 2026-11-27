'use client';
import { FormEvent, useState } from 'react';
import { api, ApiError, useQuery } from '@/lib/client';
import { ErrorBox, Notice, PageHead, Spinner, useErr } from '@/components/ui';
import { Badge, Tabs, useDateFmt, useL } from '@/components/admin/kit';
import { Guide, GuideItem } from '@/components/Guide';

interface Mine { id: string; num: number; kind: string; subject: string; text: string; status: string; resolution: string | null; createdAt: string }
const TONE: Record<string, string> = { OPEN: 'blue', REVIEWING: 'amber', RESOLVED: 'green', DISMISSED: 'gray' };

export default function Help() {
  const L = useL();
  const f = useDateFmt();
  const err = useErr();
  const [tab, setTab] = useState<'guide' | 'complain'>(() => (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'complain' ? 'complain' : 'guide'));
  const mine = useQuery<Mine[]>(tab === 'complain' ? '/me/complaints' : null);
  const [form, setForm] = useState({ kind: 'OTHER', targetEmail: '', subject: '', text: '' });
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const stL = (s: string) => ({ OPEN: L('Qabul qilindi', 'Принято', 'Received'), REVIEWING: L("Ko'rib chiqilmoqda", 'На рассмотрении', 'In review'), RESOLVED: L('Hal qilindi', 'Решено', 'Resolved'), DISMISSED: L('Rad etildi', 'Отклонено', 'Dismissed') }[s] ?? s);
  const kindL = (k: string) => ({ REVIEW: L('Sharh haqida', 'Об отзыве', 'About a review'), USER: L('Foydalanuvchi haqida', 'О пользователе', 'About a user'), GRANT: L("Grant ma'lumoti", 'Данные гранта', 'Grant information'), OTHER: L('Boshqa muammo', 'Другая проблема', 'Other problem') }[k] ?? k);

  const items: GuideItem[] = [
    { icon: 'home', title: L('Boshlash', 'Начало работы', 'Getting started'), steps: [
      L("Profilingizni to'ldiring: universitet, bosqich, GPA, IELTS. Shunda «Tavsiya etilgan» bo'limida sizga mos grantlar chiqadi.", 'Заполните профиль: университет, уровень, GPA, IELTS. Тогда в «Рекомендованных» появятся подходящие гранты.', 'Fill in your profile: university, level, GPA, IELTS. Matching grants then appear under “Recommended”.'),
      L("Yuqoridagi qidiruv orqali grant, dastur yoki universitetni toping.", 'Ищите гранты, программы и университеты через строку поиска сверху.', 'Use the search bar at the top to find grants, programs or universities.'),
    ] },
    { icon: 'search', title: L('Grant topish va saqlash', 'Поиск и сохранение грантов', 'Finding and saving grants'), steps: [
      L("«Grantlar» sahifasida davlat, ta'lim darajasi va moliyalashtirish turi bo'yicha filtrlang.", 'На странице «Гранты» фильтруйте по стране, уровню и типу финансирования.', 'On the Grants page filter by country, study level and funding type.'),
      L("Yoqqan grantni ♥ tugmasi bilan saqlang — u «Saqlanganlar» bo'limida turadi.", 'Нажмите ♥, чтобы сохранить грант — он появится в «Избранном».', 'Tap ♥ to save a grant — it will appear under “Saved”.'),
      L("Rasmiy ariza havolasi har bir grant sahifasida bor: ariza topshirish rasmiy saytda bajariladi.", 'Ссылка на официальную подачу есть на странице гранта: заявка подаётся на официальном сайте.', 'Every grant page links to the official site where you actually apply.'),
    ] },
    { icon: 'list', title: L('Arizalarni kuzatish', 'Отслеживание заявок', 'Tracking applications'), steps: [
      L("Grant sahifasida «Arizani kuzatish» ni bosing va holatni belgilang: qiziqaman, tayyorlanyapman, topshirdim va h.k.", 'На странице гранта нажмите «Отслеживать» и отметьте статус: интересуюсь, готовлюсь, подал и т.д.', 'On a grant page choose “Track application” and set the status: interested, preparing, submitted, etc.'),
      L("«Arizalarim» sahifasida barcha holatlar bir joyda ko'rinadi.", 'На странице «Заявки» все статусы собраны в одном месте.', 'The Applications page shows every status in one place.'),
    ] },
    { icon: 'file', title: L('Hujjatlar', 'Документы', 'Documents'), steps: [
      L("«Hujjatlarim» bo'limiga pasport, diplom, sertifikat va boshqa hujjatlarni (PDF, JPG, PNG) yuklang.", 'Загрузите паспорт, диплом, сертификаты и другие документы (PDF, JPG, PNG) в «Документы».', 'Upload your passport, diploma, certificates and other files (PDF, JPG, PNG) under Documents.'),
      L("Hujjatlar faqat sizga ko'rinadi. Eng ko'pi bilan 20 ta fayl saqlash mumkin.", 'Документы видны только вам. Можно хранить до 20 файлов.', 'Documents are visible only to you. You can keep up to 20 files.'),
    ] },
    { icon: 'bell', title: L('Muddatlar va eslatmalar', 'Сроки и напоминания', 'Deadlines and reminders'), steps: [
      L("«Muddatlar» sahifasida saqlangan grantlaringizning topshirish sanalari ko'rinadi.", 'На странице «Календарь» видны сроки сохранённых грантов.', 'The Calendar page lists deadlines of your saved grants.'),
      L("Muddatga yaqin qolganda emailga eslatma keladi. Uni «Sozlamalar»da o'chirib qo'yish mumkin.", 'Перед сроком приходит напоминание на email. Его можно отключить в «Настройках».', 'You get an email reminder before a deadline. You can switch it off in Settings.'),
    ] },
    { icon: 'download', title: L("Ilovani o'rnatish", 'Установка приложения', 'Installing the app'), steps: [
      L("Yuqori o'ng burchakdagi «Ilovani o'rnatish» tugmasini bosing — Grantora telefoningiz yoki kompyuteringiz bosh ekraniga qo'shiladi.", 'Нажмите кнопку установки в правом верхнем углу — Grantora появится на главном экране телефона или компьютера.', 'Press the install button in the top right — Grantora is added to your phone or computer home screen.'),
      L("iPhone’da: Safari → Ulashish → «Bosh ekranga qo'shish».", 'На iPhone: Safari → Поделиться → «На экран “Домой”».', 'On iPhone: Safari → Share → “Add to Home Screen”.'),
    ] },
    { icon: 'msg', title: L('Administrator bilan aloqa', 'Связь с администратором', 'Contacting the admin'), steps: [
      L("«Xabarlar» bo'limida administratorga savol yozing, javob o'sha yerda ko'rinadi.", 'В разделе «Сообщения» напишите администратору — ответ появится там же.', 'Write to the admin under Messages; the reply shows up there.'),
      L("Jiddiy muammo (noto'g'ri sharh, nojo'ya xatti-harakat, xato ma'lumot) bo'lsa, pastdagi «Shikoyat yuborish» orqali murojaat qiling.", 'При серьёзной проблеме (неверный отзыв, неподобающее поведение, ошибка в данных) используйте «Подать жалобу».', 'For a serious problem (wrong review, inappropriate behaviour, incorrect data) use “File a complaint”.'),
    ] },
  ];

  async function send(e: FormEvent) {
    e.preventDefault(); setMsg(null); setBusy(true);
    try {
      const body = { kind: form.kind, subject: form.subject, text: form.text, ...(form.kind === 'USER' && form.targetEmail.trim() ? { targetEmail: form.targetEmail.trim() } : {}) };
      const r = await api<{ num: number }>('/me/complaints', { body });
      setMsg({ kind: 'ok', text: L(`Shikoyat #${r.num} qabul qilindi. Natijani shu yerda va bildirishnomalarda ko'rasiz.`, `Жалоба #${r.num} принята. Результат появится здесь и в уведомлениях.`, `Complaint #${r.num} received. You'll see the outcome here and in notifications.`) });
      setForm({ kind: 'OTHER', targetEmail: '', subject: '', text: '' }); mine.reload();
    } catch (x) { setMsg({ kind: 'err', text: err((x as ApiError).code) }); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <PageHead title={L("Qo'llanma va yordam", 'Руководство и помощь', 'Guide & help')} />
      <Tabs value={tab} onChange={setTab} items={[{ v: 'guide', label: L("Sayt qo'llanmasi", 'Руководство', 'Site guide') }, { v: 'complain', label: L('Shikoyat yuborish', 'Подать жалобу', 'File a complaint') }]} />
      {tab === 'guide' && <Guide items={items} />}
      {tab === 'complain' && (
        <div className="space-y-6">
          <form onSubmit={send} className="card space-y-4 p-5">
            <p className="text-sm text-muted">{L("Boshqa foydalanuvchi, sharh yoki platformadagi muammo haqida yozing. Administrator ko'rib chiqadi va qaror haqida sizga xabar beradi.", 'Опишите проблему с другим пользователем, отзывом или платформой. Администратор рассмотрит её и сообщит о решении.', 'Describe an issue with another user, a review or the platform. An admin will review it and tell you the outcome.')}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">{L('Turi', 'Тип', 'Type')}
                <select className="input mt-1" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{['USER', 'REVIEW', 'GRANT', 'OTHER'].map((k) => <option key={k} value={k}>{kindL(k)}</option>)}</select></label>
              {form.kind === 'USER' && <label className="block text-sm font-semibold">{L('Foydalanuvchi emaili (ixtiyoriy)', 'Email пользователя (необязательно)', 'User email (optional)')}
                <input className="input mt-1" type="email" value={form.targetEmail} onChange={(e) => setForm({ ...form, targetEmail: e.target.value })} /></label>}
            </div>
            <label className="block text-sm font-semibold">{L('Mavzu', 'Тема', 'Subject')}<input className="input mt-1" required minLength={3} maxLength={120} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
            <label className="block text-sm font-semibold">{L('Tavsif (kamida 10 belgi)', 'Описание (от 10 символов)', 'Details (10+ characters)')}<textarea className="input mt-1 min-h-32 py-3" required minLength={10} maxLength={3000} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} /></label>
            {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
            <button className="btn btn-primary" disabled={busy}>{busy ? '…' : L('Yuborish', 'Отправить', 'Submit')}</button>
          </form>
          <section>
            <h2 className="mb-3 text-lg font-bold">{L('Mening shikoyatlarim', 'Мои жалобы', 'My complaints')}</h2>
            {mine.error ? <ErrorBox code={mine.error} onRetry={mine.reload} /> : !mine.data ? <Spinner /> : mine.data.length === 0 ? <p className="text-sm text-muted">{L("Hali shikoyat yo'q", 'Жалоб пока нет', 'No complaints yet')}</p> : (
              <ul className="space-y-3">{mine.data.map((c) => (
                <li key={c.id} className="card space-y-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><b className="text-navy">#{c.num} · {c.subject}</b><Badge tone={TONE[c.status]}>{stL(c.status)}</Badge></div>
                  <p className="text-xs text-muted">{kindL(c.kind)} · {f.dt(c.createdAt)}</p>
                  <p className="whitespace-pre-wrap break-words text-sm">{c.text}</p>
                  {c.resolution && <p className="rounded-xl bg-accent/60 p-3 text-sm"><b className="text-primary">{L('Administrator javobi', 'Ответ администратора', 'Admin response')}:</b> {c.resolution}</p>}
                </li>
              ))}</ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
