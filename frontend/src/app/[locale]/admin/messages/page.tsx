'use client';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError, useQuery } from '@/lib/client';
import { useErr } from '@/components/ui';
import { Avatar, EmptyState, ErrorState, Modal, PageTitle, Skeleton, Tabs, useDateFmt, useL, useToast } from '@/components/admin/kit';

interface Stu { id: string; firstName: string; lastName: string; email: string }
interface Conv { id: string; student: Stu; archived: boolean; lastMessageAt: string; last: string; lastFromAdmin: boolean; unread: number }
interface Msg { id: string; body: string; fromAdmin: boolean; createdAt: string }
interface Thread { id: string; archived: boolean; student: Stu; messages: Msg[] }
const nm = (s: Stu) => `${s.firstName} ${s.lastName}`.trim() || s.email;

export default function AdminMessages() {
  const L = useL();
  const f = useDateFmt();
  const err = useErr();
  const toast = useToast();
  const [tab, setTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [q, setQ] = useState('');
  const [qd, setQd] = useState('');
  useEffect(() => { const t = setTimeout(() => setQd(q.trim()), 350); return () => clearTimeout(t); }, [q]);
  const params = new URLSearchParams({ archived: String(tab === 'archived') });
  if (tab === 'unread') params.set('filter', 'unread');
  if (qd) params.set('q', qd);
  const list = useQuery<Conv[]>(`/admin/panel/chat/conversations?${params.toString()}`);
  const [sel, setSel] = useState<string | null>(null);
  const th = useQuery<Thread>(sel ? `/admin/panel/chat/conversations/${sel}` : null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [bc, setBc] = useState(false);
  const [nw, setNw] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const fail = (x: unknown) => toast('err', err((x as ApiError).code));

  // polling: yangi xabarlar uchun har 15 soniyada
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') { list.reload(); if (sel) th.reload(); } }, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, tab, qd]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [th.data?.messages.length, sel]);

  async function send() {
    if (!sel || !text.trim()) return; setBusy(true);
    try { await api(`/admin/panel/chat/conversations/${sel}/messages`, { body: { body: text } }); setText(''); th.reload(); list.reload(); } catch (x) { fail(x); } finally { setBusy(false); }
  }
  async function archive(v: boolean) {
    if (!sel) return;
    try { await api(`/admin/panel/chat/conversations/${sel}`, { method: 'PATCH', body: { archived: v } }); toast('ok', v ? L('Arxivlandi', 'В архиве', 'Archived') : L('Qaytarildi', 'Восстановлено', 'Restored')); setSel(null); list.reload(); } catch (x) { fail(x); }
  }
  const d = th.data;

  const listPane = (
    <div className={`flex min-h-0 flex-col rounded-2xl border border-[#E5E7EB] bg-white ${sel ? 'hidden lg:flex' : 'flex'}`}>
      <div className="space-y-2 border-b border-[#E5E7EB] p-3">
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={L('Talaba ismi yoki email', 'Имя или email студента', 'Student name or email')} aria-label={L('Qidirish', 'Поиск', 'Search')} />
        <Tabs value={tab} onChange={setTab} items={[{ v: 'all', label: L('Hammasi', 'Все', 'All') }, { v: 'unread', label: L("O'qilmagan", 'Непрочитанные', 'Unread') }, { v: 'archived', label: L('Arxiv', 'Архив', 'Archive') }]} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {list.error ? <ErrorState onRetry={list.reload} /> : !list.data ? <div className="p-3"><Skeleton rows={4} /></div> : list.data.length === 0 ? <EmptyState text={L("Suhbatlar yo'q", 'Диалогов нет', 'No conversations')} icon="inbox" /> : (
          <ul>{list.data.map((c) => (
            <li key={c.id}><button onClick={() => setSel(c.id)} className={`flex w-full items-center gap-3 border-b border-[#E5E7EB] px-3 py-3 text-left hover:bg-slate-50 ${sel === c.id ? 'bg-accent/50' : ''}`}>
              <Avatar name={nm(c.student)} size="h-10 w-10 text-sm" />
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold text-navy">{nm(c.student)}</p><span className="shrink-0 text-[11px] text-muted">{f.ago(c.lastMessageAt)}</span></div>
                <p className="truncate text-xs text-muted">{c.last ? `${c.lastFromAdmin ? L('Siz: ', 'Вы: ', 'You: ') : ''}${c.last}` : '—'}</p></div>
              {c.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}
            </button></li>
          ))}</ul>
        )}
      </div>
    </div>
  );

  const threadPane = (
    <div className={`min-h-0 flex-col rounded-2xl border border-[#E5E7EB] bg-white ${sel ? 'flex' : 'hidden lg:flex'}`}>
      {!sel ? <div className="grid flex-1 place-items-center p-6 text-center text-sm text-muted">{L('Suhbatni tanlang', 'Выберите диалог', 'Select a conversation')}</div> : !d ? <div className="p-4"><Skeleton rows={4} /></div> : (
        <>
          <div className="flex items-center gap-3 border-b border-[#E5E7EB] p-3">
            <button className="btn btn-ghost !h-9 !px-3 lg:hidden" onClick={() => setSel(null)} aria-label={L('Orqaga', 'Назад', 'Back')}>←</button>
            <Avatar name={nm(d.student)} size="h-10 w-10 text-sm" /><div className="min-w-0 flex-1"><p className="truncate font-bold">{nm(d.student)}</p><p className="truncate text-xs text-muted">{d.student.email}</p></div>
            <button className="btn btn-ghost !h-9" onClick={() => archive(!d.archived)}>{d.archived ? L('Qaytarish', 'Вернуть', 'Restore') : L('Arxivlash', 'В архив', 'Archive')}</button>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {d.messages.length === 0 && <p className="text-center text-sm text-muted">{L('Hali xabar yo‘q. Birinchi xabarni yozing.', 'Сообщений пока нет. Напишите первым.', 'No messages yet. Write the first one.')}</p>}
            {d.messages.map((m) => (
              <div key={m.id} className={`flex ${m.fromAdmin ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.fromAdmin ? 'bg-primary text-white' : 'bg-white text-ink shadow-sm'}`}><p className="whitespace-pre-wrap break-words">{m.body}</p><p className={`mt-1 text-[11px] ${m.fromAdmin ? 'text-white/70' : 'text-muted'}`}>{f.dt(m.createdAt)}</p></div></div>
            ))}
            <div ref={bottom} />
          </div>
          <form className="flex items-end gap-2 border-t border-[#E5E7EB] p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <textarea className="input max-h-32 min-h-11 flex-1 py-2.5" rows={1} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={L('Xabar yozing…', 'Напишите сообщение…', 'Write a message…')} aria-label={L('Xabar', 'Сообщение', 'Message')} />
            <button className="btn btn-primary" disabled={busy || !text.trim()}>{L('Yuborish', 'Отправить', 'Send')}</button>
          </form>
        </>
      )}
    </div>
  );

  return (
    <div>
      <PageTitle title={L('Xabarlar', 'Сообщения', 'Messages')} sub={L('Talabalar bilan suhbat', 'Переписка со студентами', 'Chat with students')}>
        <button className="btn btn-ghost" onClick={() => setNw(true)}>+ {L('Yangi suhbat', 'Новый диалог', 'New chat')}</button>
        <button className="btn btn-primary" onClick={() => setBc(true)}>{L("Umumiy e'lon", 'Общее объявление', 'Broadcast')}</button>
      </PageTitle>
      <div className="grid h-[calc(100dvh-14rem)] min-h-[420px] gap-4 lg:grid-cols-[340px_1fr]">{listPane}{threadPane}</div>
      <Broadcast open={bc} onClose={() => setBc(false)} />
      <NewChat open={nw} onClose={() => setNw(false)} onStart={(id) => { setNw(false); setTab('all'); setSel(id); list.reload(); }} />
    </div>
  );
}

function Broadcast({ open, onClose }: { open: boolean; onClose: () => void }) {
  const L = useL(); const err = useErr(); const toast = useToast();
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    try { const r = await api<{ recipients: number }>('/admin/panel/chat/broadcast', { body: { title, body } }); toast('ok', L(`${r.recipients} ta talabaga yuborildi`, `Отправлено студентам: ${r.recipients}`, `Sent to ${r.recipients} students`)); setTitle(''); setBody(''); onClose(); } catch (x) { toast('err', err((x as ApiError).code)); } finally { setBusy(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title={L("Umumiy e'lon", 'Общее объявление', 'Broadcast')}
      footer={<><button className="btn btn-ghost" onClick={onClose}>{L('Bekor qilish', 'Отмена', 'Cancel')}</button><button className="btn btn-primary" disabled={busy || title.trim().length < 2 || body.trim().length < 2} onClick={go}>{L('Yuborish', 'Отправить', 'Send')}</button></>}>
      <div className="space-y-3">
        <p className="text-xs text-muted">{L("Barcha faol talabalarning «Bildirishnomalar» bo'limiga tushadi.", 'Придёт всем активным студентам в «Уведомления».', 'Delivered to every active student under Notifications.')}</p>
        <label className="block text-xs font-semibold text-muted">{L('Sarlavha', 'Заголовок', 'Title')}<input className="input mt-1" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="block text-xs font-semibold text-muted">{L('Matn', 'Текст', 'Text')}<textarea className="input mt-1 min-h-28 py-2" maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} /></label>
      </div>
    </Modal>
  );
}

function NewChat({ open, onClose, onStart }: { open: boolean; onClose: () => void; onStart: (id: string) => void }) {
  const L = useL(); const err = useErr(); const toast = useToast();
  const [q, setQ] = useState(''); const [qd, setQd] = useState('');
  useEffect(() => { const t = setTimeout(() => setQd(q.trim()), 350); return () => clearTimeout(t); }, [q]);
  const users = useQuery<{ items: (Stu & { id: string })[] }>(open && qd.length >= 2 ? `/admin/panel/users?role=STUDENT&limit=8&q=${encodeURIComponent(qd)}` : null);
  async function start(id: string) {
    try { const r = await api<{ id: string }>('/admin/panel/chat/start', { body: { studentId: id } }); onStart(r.id); } catch (x) { toast('err', err((x as ApiError).code)); }
  }
  return (
    <Modal open={open} onClose={onClose} title={L('Yangi suhbat', 'Новый диалог', 'New chat')}>
      <input className="input" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={L('Talaba ismi yoki email (kamida 2 belgi)', 'Имя или email студента (от 2 символов)', 'Student name or email (2+ chars)')} />
      <ul className="mt-3 divide-y divide-[#E5E7EB]">
        {users.data?.items.map((s) => <li key={s.id}><button className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-slate-50" onClick={() => start(s.id)}><Avatar name={nm(s)} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{nm(s)}</p><p className="truncate text-xs text-muted">{s.email}</p></div></button></li>)}
        {users.data && users.data.items.length === 0 && <li className="py-3 text-sm text-muted">{L('Topilmadi', 'Не найдено', 'No matches')}</li>}
      </ul>
    </Modal>
  );
}
