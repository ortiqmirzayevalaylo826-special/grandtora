'use client';
import { useState } from 'react';
import { api, ApiError, useQuery } from '@/lib/client';
import { useErr } from '@/components/ui';
import { Avatar, Badge, Col, DataTable, Drawer, PageTitle, Pagination, SearchBox, Select, Skeleton, Tabs, useDateFmt, useL, useTable, useToast } from '@/components/admin/kit';

interface Row { id: string; num: number; name: string; email: string; subject: string; category: string; priority: 'LOW' | 'NORMAL' | 'HIGH'; stage: 'NEW' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED'; createdAt: string; replies: number; assignee: string | null }
interface Page { items: Row[]; total: number; page: number; pages: number; limit: number; counts: Record<string, number> }
interface Detail extends Row { message: string; locale: string; assigneeId: string | null; assigneeName: string; replies: any; }
const STAGES = ['NEW', 'IN_PROGRESS', 'ANSWERED', 'CLOSED'] as const;
const STAGE_TONE: Record<string, string> = { NEW: 'blue', IN_PROGRESS: 'amber', ANSWERED: 'green', CLOSED: 'gray' };
const PRI_TONE: Record<string, string> = { HIGH: 'red', NORMAL: 'amber', LOW: 'gray' };

export default function AdminTickets() {
  const L = useL();
  const f = useDateFmt();
  const err = useErr();
  const toast = useToast();
  const tb = useTable({ sort: 'createdAt', f: { stage: '', priority: '', category: '' } });
  const { data, error, loading, reload } = useQuery<Page>(`/admin/panel/tickets?${tb.qs}`);
  const [open, setOpen] = useState<string | null>(null);
  const detail = useQuery<any>(open ? `/admin/panel/tickets/${open}` : null);
  const admins = useQuery<{ id: string; firstName: string; lastName: string; email: string }[]>(open ? '/admin/panel/admins' : null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const stageL = (s: string) => ({ NEW: L('Yangi', 'Новое', 'New'), IN_PROGRESS: L('Jarayonda', 'В работе', 'In progress'), ANSWERED: L('Javob berilgan', 'Отвечено', 'Answered'), CLOSED: L('Yopilgan', 'Закрыто', 'Closed') }[s] ?? s);
  const priL = (s: string) => ({ HIGH: L('Yuqori', 'Высокая', 'High'), NORMAL: L("O'rta", 'Средняя', 'Medium'), LOW: L('Past', 'Низкая', 'Low') }[s] ?? s);
  const catL = (s: string) => ({ general: L('Umumiy', 'Общий', 'General'), grants: L('Grantlar', 'Гранты', 'Grants'), account: L('Hisob', 'Аккаунт', 'Account'), technical: L('Texnik', 'Техническое', 'Technical'), other: L('Boshqa', 'Другое', 'Other') }[s] ?? s);
  const fail = (x: unknown) => toast('err', err((x as ApiError).code));

  async function patch(id: string, body: object) {
    try { await api(`/admin/panel/tickets/${id}`, { method: 'PATCH', body }); toast('ok', L('Saqlandi', 'Сохранено', 'Saved')); reload(); detail.reload(); } catch (x) { fail(x); }
  }
  async function send() {
    if (!open || reply.trim().length < 2) return;
    setBusy(true);
    try { await api(`/admin/panel/tickets/${open}/reply`, { body: { body: reply } }); toast('ok', L('Javob yuborildi (emailga)', 'Ответ отправлен на email', 'Reply sent by email')); setReply(''); reload(); detail.reload(); } catch (x) { fail(x); } finally { setBusy(false); }
  }

  const cols: Col<Row>[] = [
    { key: 'num', label: 'ID', sort: 'num', render: (r) => <span className="font-mono text-xs text-muted">#{r.num}</span> },
    { key: 'subject', label: L('Mavzu', 'Тема', 'Subject'), render: (r) => <span className="block max-w-[260px] truncate font-semibold text-navy">{r.subject}</span> },
    { key: 'from', label: L('Kimdan', 'От кого', 'From'), render: (r) => <div className="min-w-0"><p className="truncate text-sm">{r.name}</p><p className="truncate text-xs text-muted">{r.email}</p></div> },
    { key: 'cat', label: L('Kategoriya', 'Категория', 'Category'), render: (r) => <span className="text-xs">{catL(r.category)}</span> },
    { key: 'date', label: L('Sana', 'Дата', 'Date'), sort: 'createdAt', render: (r) => <span className="whitespace-nowrap text-xs">{f.date(r.createdAt)}</span> },
    { key: 'pri', label: L('Muhimlik', 'Важность', 'Priority'), sort: 'priority', render: (r) => <Badge tone={PRI_TONE[r.priority]}>{priL(r.priority)}</Badge> },
    { key: 'stage', label: L('Holat', 'Статус', 'Status'), sort: 'stage', render: (r) => <Badge tone={STAGE_TONE[r.stage]}>{stageL(r.stage)}</Badge> },
    { key: 'as', label: L("Mas'ul", 'Ответственный', 'Assignee'), render: (r) => <span className="text-xs text-muted">{r.assignee ?? '—'}</span> },
  ];
  const card = (r: Row) => (
    <button className="block w-full space-y-2 text-left" onClick={() => setOpen(r.id)}>
      <div className="flex items-start justify-between gap-2"><p className="font-bold text-navy">{r.subject}</p><span className="font-mono text-xs text-muted">#{r.num}</span></div>
      <p className="text-xs text-muted">{r.name} · {r.email}</p>
      <div className="flex flex-wrap items-center gap-2"><Badge tone={STAGE_TONE[r.stage]}>{stageL(r.stage)}</Badge><Badge tone={PRI_TONE[r.priority]}>{priL(r.priority)}</Badge><span className="text-xs text-muted">{f.date(r.createdAt)}</span></div>
    </button>
  );
  const d: Detail | null = detail.data;

  return (
    <div>
      <PageTitle title={L('Murojaatlar', 'Обращения', 'Inquiries')} sub={L("Aloqa formasi orqali kelgan xabarlar", 'Сообщения из формы обратной связи', 'Messages from the contact form')} />
      <Tabs value={(tb.s.f.stage as any) || ''} onChange={(v) => tb.setFilter('stage', v)}
        items={[{ v: '', label: L('Hammasi', 'Все', 'All'), n: data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : undefined }, ...STAGES.map((s) => ({ v: s as string, label: stageL(s), n: data?.counts[s] ?? 0 }))]} />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchBox value={tb.qInput} onChange={tb.setQInput} placeholder={L('Mavzu, ism yoki email', 'Тема, имя или email', 'Subject, name or email')} />
        <Select value={tb.s.f.category} onChange={(v) => tb.setFilter('category', v)} label={L('Kategoriya: barchasi', 'Категория: все', 'Category: all')} options={['general', 'grants', 'account', 'technical', 'other'].map((c) => [c, catL(c)])} />
        <Select value={tb.s.f.priority} onChange={(v) => tb.setFilter('priority', v)} label={L('Muhimlik: barchasi', 'Важность: все', 'Priority: all')} options={['HIGH', 'NORMAL', 'LOW'].map((c) => [c, priL(c)])} />
      </div>
      <DataTable cols={cols} rows={data?.items} loading={loading} error={!!error} onRetry={reload} card={card} sort={tb.s.sort} dir={tb.s.dir} onSort={tb.toggleSort} onRow={(r) => setOpen(r.id)} empty={L("Murojaat yo'q", 'Обращений нет', 'No inquiries')} />
      {data && data.total > 0 && <Pagination page={data.page} pages={data.pages} total={data.total} limit={tb.s.limit} onPage={tb.setPage} onLimit={tb.setLimit} />}

      <Drawer open={!!open} onClose={() => { setOpen(null); setReply(''); }} title={d ? `#${d.num} · ${d.subject}` : L('Murojaat', 'Обращение', 'Inquiry')}>
        {!d ? <Skeleton rows={4} /> : (
          <div className="space-y-5">
            <div className="flex items-center gap-3"><Avatar name={d.name} size="h-11 w-11 text-sm" /><div className="min-w-0"><p className="font-bold">{d.name}</p><a className="truncate text-sm text-primary" href={`mailto:${d.email}`}>{d.email}</a></div><span className="ml-auto text-xs text-muted">{f.dt(d.createdAt)}</span></div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed"><p className="whitespace-pre-wrap break-words">{d.message}</p></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="text-xs font-semibold text-muted">{L('Holat', 'Статус', 'Status')}
                <select className="input mt-1" value={d.stage} onChange={(e) => patch(d.id, { stage: e.target.value })}>{STAGES.map((s) => <option key={s} value={s}>{stageL(s)}</option>)}</select></label>
              <label className="text-xs font-semibold text-muted">{L('Muhimlik', 'Важность', 'Priority')}
                <select className="input mt-1" value={d.priority} onChange={(e) => patch(d.id, { priority: e.target.value })}>{['HIGH', 'NORMAL', 'LOW'].map((s) => <option key={s} value={s}>{priL(s)}</option>)}</select></label>
              <label className="text-xs font-semibold text-muted">{L("Mas'ul admin", 'Ответственный', 'Assignee')}
                <select className="input mt-1" value={d.assigneeId ?? ''} onChange={(e) => patch(d.id, { assigneeId: e.target.value || null })}>
                  <option value="">—</option>{admins.data?.map((a) => <option key={a.id} value={a.id}>{`${a.firstName} ${a.lastName}`.trim() || a.email}</option>)}</select></label>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold">{L('Javoblar tarixi', 'История ответов', 'Reply history')}</h3>
              {(d.replies as any[]).length === 0 ? <p className="text-sm text-muted">{L("Hali javob yozilmagan", 'Ответов пока нет', 'No replies yet')}</p> : (
                <ul className="space-y-3">{(d.replies as any[]).map((r) => (
                  <li key={r.id} className="rounded-2xl border border-primary/20 bg-accent/40 p-3 text-sm"><p className="mb-1 text-xs font-semibold text-primary">{r.authorName || 'Admin'} · {f.dt(r.createdAt)}</p><p className="whitespace-pre-wrap break-words">{r.body}</p></li>
                ))}</ul>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold" htmlFor="rp">{L('Javob yozish', 'Написать ответ', 'Write a reply')}</label>
              <textarea id="rp" className="input min-h-28 py-3" maxLength={4000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder={L('Javob foydalanuvchining emailiga yuboriladi…', 'Ответ уйдёт на email пользователя…', "The reply is emailed to the sender…")} />
              <div className="mt-2 flex flex-wrap justify-end gap-2">
                {d.stage !== 'CLOSED' && <button className="btn btn-ghost" onClick={() => patch(d.id, { stage: 'CLOSED' })}>{L('Yopish', 'Закрыть', 'Close')}</button>}
                <button className="btn btn-primary" disabled={busy || reply.trim().length < 2} onClick={send}>{busy ? '…' : L('Javob yuborish', 'Отправить ответ', 'Send reply')}</button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
