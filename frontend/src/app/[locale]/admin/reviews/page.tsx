'use client';
import { useState } from 'react';
import { api, ApiError, useQuery } from '@/lib/client';
import { useErr } from '@/components/ui';
import { Avatar, Badge, Col, Confirm, DataTable, IconBtn, PageTitle, Pagination, SearchBox, Select, Stars, Tabs, useDateFmt, useL, useTable, useToast } from '@/components/admin/kit';

interface Row { id: string; stars: number; text: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN'; createdAt: string; user: string; email: string; slug: string; grant: string }
interface Page { items: Row[]; total: number; page: number; pages: number; limit: number; counts: Record<string, number> }
const TONE: Record<string, string> = { PENDING: 'amber', APPROVED: 'green', REJECTED: 'red', HIDDEN: 'gray' };

export default function AdminReviews() {
  const L = useL();
  const f = useDateFmt();
  const err = useErr();
  const toast = useToast();
  const tb = useTable({ sort: 'createdAt', f: { status: 'PENDING', stars: '' } });
  const { data, error, loading, reload } = useQuery<Page>(`/admin/panel/reviews?${tb.qs}`);
  const [del, setDel] = useState<Row | null>(null);
  const stL = (s: string) => ({ PENDING: L('Kutilmoqda', 'На проверке', 'Pending'), APPROVED: L('Tasdiqlangan', 'Одобрен', 'Approved'), REJECTED: L('Rad etilgan', 'Отклонён', 'Rejected'), HIDDEN: L('Yashirin', 'Скрыт', 'Hidden') }[s] ?? s);
  async function setS(r: Row, status: string) {
    try { await api(`/admin/panel/reviews/${r.id}`, { method: 'PATCH', body: { status } }); toast('ok', L('Saqlandi', 'Сохранено', 'Saved')); reload(); } catch (x) { toast('err', err((x as ApiError).code)); }
  }
  async function remove() {
    if (!del) return;
    try { await api(`/admin/panel/reviews/${del.id}`, { method: 'DELETE' }); toast('ok', L("O'chirildi", 'Удалено', 'Deleted')); setDel(null); reload(); } catch (x) { toast('err', err((x as ApiError).code)); }
  }
  const actions = (r: Row) => (
    <div className="flex">
      {r.status !== 'APPROVED' && <IconBtn icon="check" label={L('Tasdiqlash', 'Одобрить', 'Approve')} tone="hover:!text-primary" onClick={() => setS(r, 'APPROVED')} />}
      {r.status !== 'REJECTED' && <IconBtn icon="x" label={L('Rad etish', 'Отклонить', 'Reject')} tone="hover:!text-red-600" onClick={() => setS(r, 'REJECTED')} />}
      {r.status === 'APPROVED' && <IconBtn icon="eyeoff" label={L('Yashirish', 'Скрыть', 'Hide')} onClick={() => setS(r, 'HIDDEN')} />}
      <IconBtn icon="trash" label={L("O'chirish", 'Удалить', 'Delete')} tone="hover:!text-red-600" onClick={() => setDel(r)} />
    </div>
  );
  const cols: Col<Row>[] = [
    { key: 'u', label: L('Talaba', 'Студент', 'Student'), render: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.user || r.email} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{r.user}</p><p className="truncate text-xs text-muted">{r.email}</p></div></div> },
    { key: 'g', label: L('Grant', 'Грант', 'Grant'), render: (r) => <span className="block max-w-[170px] truncate">{r.grant}</span> },
    { key: 't', label: L('Sharh', 'Отзыв', 'Review'), render: (r) => <span className="line-clamp-2 max-w-[300px] text-sm">{r.text}</span> },
    { key: 's', label: L('Reyting', 'Рейтинг', 'Rating'), render: (r) => <Stars n={r.stars} /> },
    { key: 'd', label: L('Sana', 'Дата', 'Date'), sort: 'createdAt', render: (r) => <span className="whitespace-nowrap text-xs">{f.date(r.createdAt)}</span> },
    { key: 'st', label: L('Holat', 'Статус', 'Status'), render: (r) => <Badge tone={TONE[r.status]}>{stL(r.status)}</Badge> },
    { key: 'a', label: L('Amallar', 'Действия', 'Actions'), render: actions },
  ];
  const card = (r: Row) => (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3"><Avatar name={r.user || r.email} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{r.user}</p><p className="truncate text-xs text-muted">{r.grant}</p></div><Badge tone={TONE[r.status]}>{stL(r.status)}</Badge></div>
      <Stars n={r.stars} /><p className="text-sm">{r.text}</p>
      <div className="flex items-center justify-between"><span className="text-xs text-muted">{f.date(r.createdAt)}</span>{actions(r)}</div>
    </div>
  );
  return (
    <div>
      <PageTitle title={L('Sharhlar', 'Отзывы', 'Reviews')} sub={L("Faqat tasdiqlangan sharhlar ochiq saytda ko'rinadi", 'На сайте видны только одобренные отзывы', 'Only approved reviews appear on the public site')} />
      <Tabs value={tb.s.f.status as any} onChange={(v) => tb.setFilter('status', v)} items={[{ v: '', label: L('Hammasi', 'Все', 'All') }, ...['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN'].map((s) => ({ v: s, label: stL(s), n: data?.counts[s] ?? 0 }))]} />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchBox value={tb.qInput} onChange={tb.setQInput} placeholder={L('Sharh matni, email yoki grant', 'Текст, email или грант', 'Text, email or grant')} />
        <Select value={tb.s.f.stars} onChange={(v) => tb.setFilter('stars', v)} label={L('Reyting: barchasi', 'Рейтинг: все', 'Rating: all')} options={[5, 4, 3, 2, 1].map((n) => [String(n), '★'.repeat(n)])} />
      </div>
      <DataTable cols={cols} rows={data?.items} loading={loading} error={!!error} onRetry={reload} card={card} sort={tb.s.sort} dir={tb.s.dir} onSort={tb.toggleSort} empty={L("Sharhlar yo'q", 'Отзывов нет', 'No reviews')} />
      {data && data.total > 0 && <Pagination page={data.page} pages={data.pages} total={data.total} limit={tb.s.limit} onPage={tb.setPage} onLimit={tb.setLimit} />}
      <Confirm open={!!del} danger onClose={() => setDel(null)} onConfirm={remove} label={L("O'chirish", 'Удалить', 'Delete')} title={L("Sharhni o'chirish", 'Удалить отзыв', 'Delete review')} text={L("Sharh butunlay o'chiriladi. Yashirish uchun «Yashirish» tugmasidan foydalaning.", 'Отзыв будет удалён. Чтобы просто скрыть его, используйте «Скрыть».', 'The review will be deleted permanently. Use “Hide” to keep it without showing it.')} />
    </div>
  );
}
