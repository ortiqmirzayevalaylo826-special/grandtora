'use client';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { api, ApiError, useQuery } from '@/lib/client';
import { useErr } from '@/components/ui';
import { Avatar, Badge, Col, Confirm, DataTable, Drawer, PageTitle, Pagination, SearchBox, Select, Skeleton, Tabs, useDateFmt, useL, useTable, useToast } from '@/components/admin/kit';

interface U { id: string; firstName: string; lastName: string; email: string; blockedAt?: string | null }
interface Row { id: string; num: number; kind: string; subject: string; text: string; status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED'; resolution: string | null; createdAt: string; reporter: U; target: U | null }
interface Page { items: Row[]; total: number; page: number; pages: number; limit: number; counts: Record<string, number> }
const TONE: Record<string, string> = { OPEN: 'blue', REVIEWING: 'amber', RESOLVED: 'green', DISMISSED: 'gray' };
const nm = (u: U) => `${u.firstName} ${u.lastName}`.trim() || u.email;

export default function AdminComplaints() {
  const L = useL();
  const f = useDateFmt();
  const err = useErr();
  const toast = useToast();
  const tb = useTable({ sort: 'createdAt', f: { status: '', kind: '' } });
  const { data, error, loading, reload } = useQuery<Page>(`/admin/panel/complaints?${tb.qs}`);
  const [open, setOpen] = useState<string | null>(null);
  const detail = useQuery<Row>(open ? `/admin/panel/complaints/${open}` : null);
  const [res, setRes] = useState('');
  const [busy, setBusy] = useState(false);
  const [blk, setBlk] = useState<U | null>(null);
  const d = detail.data;
  useEffect(() => { setRes(d?.resolution ?? ''); }, [d?.id, d?.resolution]);
  const stL = (s: string) => ({ OPEN: L('Yangi', 'Новая', 'New'), REVIEWING: L("Ko'rilmoqda", 'На рассмотрении', 'In review'), RESOLVED: L('Hal qilindi', 'Решена', 'Resolved'), DISMISSED: L('Rad etildi', 'Отклонена', 'Dismissed') }[s] ?? s);
  const kindL = (k: string) => ({ REVIEW: L('Sharh', 'Отзыв', 'Review'), USER: L('Foydalanuvchi', 'Пользователь', 'User'), GRANT: L('Grant', 'Грант', 'Grant'), OTHER: L('Boshqa', 'Другое', 'Other') }[k] ?? k);
  const fail = (x: unknown) => toast('err', err((x as ApiError).code));

  async function patch(status: string) {
    if (!open) return; setBusy(true);
    try { await api(`/admin/panel/complaints/${open}`, { method: 'PATCH', body: { status, resolution: res.trim() || undefined } }); toast('ok', L('Saqlandi', 'Сохранено', 'Saved')); reload(); detail.reload(); } catch (x) { fail(x); } finally { setBusy(false); }
  }
  async function doBlock() {
    if (!blk) return; setBusy(true);
    try { await api(`/admin/panel/users/${blk.id}/block`, { method: 'PATCH', body: { blocked: !blk.blockedAt } }); toast('ok', L('Bajarildi', 'Выполнено', 'Done')); setBlk(null); detail.reload(); } catch (x) { fail(x); } finally { setBusy(false); }
  }
  const cols: Col<Row>[] = [
    { key: 'num', label: 'ID', sort: 'num', render: (r) => <span className="font-mono text-xs text-muted">#{r.num}</span> },
    { key: 's', label: L('Mavzu', 'Тема', 'Subject'), render: (r) => <span className="block max-w-[240px] truncate font-semibold text-navy">{r.subject}</span> },
    { key: 'k', label: L('Turi', 'Тип', 'Type'), render: (r) => <span className="text-xs">{kindL(r.kind)}</span> },
    { key: 'rp', label: L('Shikoyatchi', 'Заявитель', 'Reporter'), render: (r) => <span className="block max-w-[170px] truncate text-sm">{nm(r.reporter)}</span> },
    { key: 'tg', label: L('Kimga qarshi', 'На кого', 'Against'), render: (r) => <span className="block max-w-[170px] truncate text-sm text-muted">{r.target ? nm(r.target) : '—'}</span> },
    { key: 'd', label: L('Sana', 'Дата', 'Date'), sort: 'createdAt', render: (r) => <span className="whitespace-nowrap text-xs">{f.date(r.createdAt)}</span> },
    { key: 'st', label: L('Holat', 'Статус', 'Status'), sort: 'status', render: (r) => <Badge tone={TONE[r.status]}>{stL(r.status)}</Badge> },
  ];
  const card = (r: Row) => (
    <button className="block w-full space-y-2 text-left" onClick={() => setOpen(r.id)}>
      <div className="flex items-start justify-between gap-2"><p className="font-bold text-navy">{r.subject}</p><span className="font-mono text-xs text-muted">#{r.num}</span></div>
      <p className="text-xs text-muted">{nm(r.reporter)}{r.target ? ` → ${nm(r.target)}` : ''}</p>
      <div className="flex flex-wrap items-center gap-2"><Badge tone={TONE[r.status]}>{stL(r.status)}</Badge><span className="text-xs text-muted">{kindL(r.kind)} · {f.date(r.createdAt)}</span></div>
    </button>
  );
  const closed = d && (d.status === 'RESOLVED' || d.status === 'DISMISSED');
  return (
    <div>
      <PageTitle title={L('Shikoyatlar', 'Жалобы', 'Complaints')} sub={L("Foydalanuvchilar o'rtasidagi muammolar va nizolar", 'Проблемы и споры между пользователями', 'Issues and disputes between users')} />
      <Tabs value={tb.s.f.status} onChange={(v) => tb.setFilter('status', v)} items={[{ v: '', label: L('Hammasi', 'Все', 'All'), n: data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : undefined }, ...(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'] as const).map((s) => ({ v: s as string, label: stL(s), n: data?.counts[s] ?? 0 }))]} />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchBox value={tb.qInput} onChange={tb.setQInput} placeholder={L('Mavzu, matn yoki email', 'Тема, текст или email', 'Subject, text or email')} />
        <Select value={tb.s.f.kind} onChange={(v) => tb.setFilter('kind', v)} label={L('Turi: barchasi', 'Тип: все', 'Type: all')} options={['USER', 'REVIEW', 'GRANT', 'OTHER'].map((k) => [k, kindL(k)])} />
      </div>
      <DataTable cols={cols} rows={data?.items} loading={loading} error={!!error} onRetry={reload} card={card} sort={tb.s.sort} dir={tb.s.dir} onSort={tb.toggleSort} onRow={(r) => setOpen(r.id)} empty={L("Shikoyat yo'q", 'Жалоб нет', 'No complaints')} />
      {data && data.total > 0 && <Pagination page={data.page} pages={data.pages} total={data.total} limit={tb.s.limit} onPage={tb.setPage} onLimit={tb.setLimit} />}

      <Drawer open={!!open} onClose={() => setOpen(null)} title={d ? `#${d.num} · ${d.subject}` : L('Shikoyat', 'Жалоба', 'Complaint')}>
        {!d ? <Skeleton rows={4} /> : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2"><Badge tone={TONE[d.status]}>{stL(d.status)}</Badge><Badge tone="navy">{kindL(d.kind)}</Badge><span className="text-xs text-muted">{f.dt(d.createdAt)}</span></div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm"><p className="whitespace-pre-wrap break-words">{d.text}</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#E5E7EB] p-3"><p className="mb-2 text-xs font-semibold text-muted">{L('Shikoyatchi', 'Заявитель', 'Reporter')}</p><div className="flex items-center gap-2"><Avatar name={nm(d.reporter)} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{nm(d.reporter)}</p><p className="truncate text-xs text-muted">{d.reporter.email}</p></div></div></div>
              <div className="rounded-2xl border border-[#E5E7EB] p-3"><p className="mb-2 text-xs font-semibold text-muted">{L('Kimga qarshi', 'На кого', 'Against')}</p>
                {d.target ? <div className="flex items-center gap-2"><Avatar name={nm(d.target)} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{nm(d.target)}</p><p className="truncate text-xs text-muted">{d.target.email}</p></div></div> : <p className="text-sm text-muted">—</p>}
                {d.target && <div className="mt-3 flex flex-wrap gap-2"><button className="btn btn-ghost !h-9 text-xs" onClick={() => setBlk(d.target)}>{d.target.blockedAt ? L('Blokdan chiqarish', 'Разблокировать', 'Unblock') : L('Bloklash', 'Заблокировать', 'Block')}</button><Link href={`/admin/users?q=${encodeURIComponent(d.target.email)}`} className="btn btn-ghost !h-9 text-xs">{L('Profil', 'Профиль', 'Profile')}</Link></div>}
              </div>
            </div>
            {d.kind === 'REVIEW' && <Link href="/admin/reviews" className="btn btn-ghost">{L("Sharhlarni ko'rish", 'К отзывам', 'Go to reviews')}</Link>}
            <div>
              <label className="mb-1 block text-sm font-bold" htmlFor="res">{L('Qaror / javob (shikoyatchiga bildirishnoma sifatida boradi)', 'Решение / ответ (уйдёт заявителю уведомлением)', 'Resolution / reply (sent to the reporter as a notification)')}</label>
              <textarea id="res" className="input min-h-28 py-3" maxLength={2000} value={res} onChange={(e) => setRes(e.target.value)} />
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {d.status === 'OPEN' && <button className="btn btn-ghost" disabled={busy} onClick={() => patch('REVIEWING')}>{L("Ko'rib chiqishni boshlash", 'Взять в работу', 'Start review')}</button>}
                {closed && <button className="btn btn-ghost" disabled={busy} onClick={() => patch('REVIEWING')}>{L('Qayta ochish', 'Переоткрыть', 'Reopen')}</button>}
                {!closed && <button className="btn btn-ghost" disabled={busy || res.trim().length < 2} onClick={() => patch('DISMISSED')}>{L('Rad etish', 'Отклонить', 'Dismiss')}</button>}
                {!closed && <button className="btn btn-primary" disabled={busy || res.trim().length < 2} onClick={() => patch('RESOLVED')}>{L('Hal qilindi', 'Решено', 'Mark resolved')}</button>}
              </div>
            </div>
          </div>
        )}
      </Drawer>
      <Confirm open={!!blk} busy={busy} danger={!blk?.blockedAt} onClose={() => setBlk(null)} onConfirm={doBlock}
        title={blk?.blockedAt ? L('Blokdan chiqarish', 'Разблокировка', 'Unblock user') : L('Foydalanuvchini bloklash', 'Блокировка пользователя', 'Block user')}
        text={blk?.blockedAt ? L(`${blk?.email} yana kira oladi.`, `${blk?.email} снова сможет войти.`, `${blk?.email} will be able to sign in again.`) : L(`${blk?.email} tizimga kira olmaydi.`, `${blk?.email} не сможет войти.`, `${blk?.email} will be signed out and unable to sign in.`)} />
    </div>
  );
}
