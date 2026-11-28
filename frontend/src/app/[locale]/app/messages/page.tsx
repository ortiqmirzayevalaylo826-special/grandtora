'use client';
import { useEffect, useRef, useState } from 'react';
import { api, ApiError, useQuery } from '@/lib/client';
import { useErr, PageHead, Spinner, ErrorBox } from '@/components/ui';
import { useDateFmt, useL } from '@/components/admin/kit';

interface Msg { id: string; body: string; fromAdmin: boolean; createdAt: string }

export default function StudentMessages() {
  const L = useL();
  const f = useDateFmt();
  const err = useErr();
  const { data, error, loading, reload } = useQuery<{ messages: Msg[] }>('/me/chat');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => { const t = setInterval(() => { if (document.visibilityState === 'visible') reload(); }, 8000); return () => clearInterval(t); }, [reload]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [data?.messages.length]);
  if (loading && !data) return <Spinner />;
  if (error || !data) return <ErrorBox code={error ?? 'generic'} onRetry={reload} />;
  async function send() {
    if (!text.trim()) return; setBusy(true); setMsg(null);
    try { await api('/me/chat', { body: { body: text } }); setText(''); reload(); } catch (x) { setMsg(err((x as ApiError).code)); } finally { setBusy(false); }
  }
  return (
    <div>
      <PageHead title={L('Xabarlar', 'Сообщения', 'Messages')} />
      <div className="flex h-[calc(100dvh-13rem)] min-h-[360px] flex-col rounded-2xl border border-[#E5E7EB] bg-white">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
          {data.messages.length === 0 && <p className="py-10 text-center text-sm text-muted">{L("Savolingiz bormi? Administratorga yozing — javob shu yerda ko'rinadi.", 'Есть вопрос? Напишите администратору — ответ появится здесь.', 'Have a question? Write to the admin — replies appear here.')}</p>}
          {data.messages.map((m) => (
            <div key={m.id} className={`flex ${m.fromAdmin ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.fromAdmin ? 'bg-white shadow-sm' : 'bg-primary text-white'}`}>
              {m.fromAdmin && <p className="mb-0.5 text-xs font-semibold text-primary">Admin</p>}
              <p className="whitespace-pre-wrap break-words">{m.body}</p><p className={`mt-1 text-[11px] ${m.fromAdmin ? 'text-muted' : 'text-white/70'}`}>{f.dt(m.createdAt)}</p></div></div>
          ))}
          <div ref={bottom} />
        </div>
        {msg && <p className="px-4 pt-2 text-sm text-red-700" role="alert">{msg}</p>}
        <form className="flex items-end gap-2 border-t border-[#E5E7EB] p-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <textarea className="input max-h-32 min-h-11 flex-1 py-2.5" rows={1} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={L('Xabar yozing…', 'Напишите сообщение…', 'Write a message…')} aria-label={L('Xabar', 'Сообщение', 'Message')} />
          <button className="btn btn-primary" disabled={busy || !text.trim()}>{L('Yuborish', 'Отправить', 'Send')}</button>
        </form>
      </div>
    </div>
  );
}
