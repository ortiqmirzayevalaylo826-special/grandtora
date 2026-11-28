'use client';
import { useState } from 'react';
import { api, ApiError, useQuery } from '@/lib/client';
import { useErr } from '@/components/ui';
import { Avatar, Badge, Col, DataTable, Modal, PageTitle, Pagination, SearchBox, Tabs, useDateFmt, useL, useTable, useToast } from '@/components/admin/kit';

interface Row { id: string; review: string; submittedAt: string | null; updatedAt: string; user: { firstName: string; lastName: string; email: string }; slug: string; title: string }
interface Page { items: Row[]; total: number; page: number; pages: number; limit: number; counts: Record<string, number> }
interface Detail { id: string; review: string; reviewNote: string | null; motivation: string | null; submittedAt: string | null; title: string; slug: string;
  user: { firstName: string; lastName: string; email: string; profile: Record<string, any> | null }; documents: { id: string; name: string; mime: string; sizeBytes: number }[] }
const TONE: Record<string, string> = { SUBMITTED: 'amber', IN_REVIEW: 'blue', NEEDS_INFO: 'amber', APPROVED: 'green', REJECTED: 'red' };

function useReviewLabel() {
  const L = useL();
  return (s: string) => ({ SUBMITTED: L('Yangi', 'Новая', 'New'), IN_REVIEW: L("Ko'rib chiqilmoqda", 'На рассмотрении', 'In review'), NEEDS_INFO: L("Ma'lumot kerak", 'Нужна информация', 'Needs info'), APPROVED: L('Qabul qilindi', 'Одобрена', 'Approved'), REJECTED: L('Rad etildi', 'Отклонена', 'Rejected') } as Record<string, string>)[s] ?? s;
}

function DetailModal({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const L = useL();
  const err = useErr();
  const toast = useToast();
  const lab = useReviewLabel();
  const { data, error } = useQuery<Detail>(`/admin/panel/applications/${id}`);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  async function act(status: string) {
    setBusy(true);
    try { await api(`/admin/panel/applications/${id}/review`, { method: 'PATCH', body: { status, note: note.trim() || undefined } }); toast('ok', L('Saqlandi', 'Сохранено', 'Saved')); onDone(); onClose(); }
    catch (x) { toast('err', err((x as ApiError).code)); } finally { setBusy(false); }
  }
  const p = data?.user.profile ?? {};
  const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
  return (
    <Modal open onClose={onClose} title={data ? data.title : '…'}
      footer={data && <>
        <button className="btn btn-ghost" disabled={busy} onClick={() => act('IN_REVIEW')}>{L("Ko'rib chiqish", 'Взять в работу', 'Start review')}</button>
        <button className="btn btn-ghost" disabled={busy} onClick={() => act('NEEDS_INFO')}>{L("Ma'lumot so'rash", 'Запросить информацию', 'Request info')}</button>
        <button className="btn bg-red-600 text-white hover:bg-red-700" disabled={busy} onClick={() => act('REJECTED')}>{L('Rad etish', 'Отклонить', 'Reject')}</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => act('APPROVED')}>{L('Qabul qilish', 'Одобрить', 'Approve')}</button>
      </>}>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="text-sm text-muted">…</p>}
      {data && (
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3"><Avatar name={`${data.user.firstName} ${data.user.lastName}`} /><div><p className="font-semibold">{data.user.firstName} {data.user.lastName}</p><p className="text-xs text-muted">{data.user.email}</p></div><span className="ml-auto"><Badge tone={TONE[data.review]}>{lab(data.review)}</Badge></span></div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl bg-canvas p-3 text-xs">
            {[['country', L('Davlat', 'Страна', 'Country')], ['university', L('Universitet', 'Университет', 'University')], ['major', L('Yo‘nalish', 'Направление', 'Major')], ['level', L('Daraja', 'Уровень', 'Level')], ['gpa', 'GPA'], ['ielts', 'IELTS']].map(([k, l]) => (
              <div key={k} className="min-w-0"><dt className="text-muted">{l}</dt><dd className="truncate font-semibold text-navy">{p[k] ?? '—'}</dd></div>
            ))}
          </dl>
          <div><p className="mb-1 font-bold text-navy">{L('Motivatsiya', 'Мотивация', 'Motivation')}</p><p className="whitespace-pre-wrap rounded-xl border border-navy/10 p-3">{data.motivation}</p></div>
          <div>
            <p className="mb-1 font-bold text-navy">{L('Hujjatlar', 'Документы', 'Documents')}</p>
            <ul className="space-y-1">{data.documents.map((d) => (
              <li key={d.id}><a className="flex items-center justify-between gap-2 rounded-xl border border-navy/10 px-3 py-2 hover:bg-canvas" href={`/api/admin/panel/applications/${data.id}/documents/${d.id}`}><span className="truncate font-semibold text-primary">{d.name}</span><span className="shrink-0 text-xs text-muted">{kb(d.sizeBytes)}</span></a></li>
            ))}{data.documents.length === 0 && <li className="text-muted">—</li>}</ul>
          </div>
          {data.reviewNote && <p className="rounded-xl bg-amber-50 p-3 text-amber-900"><b>{L('Oldingi izoh', 'Прошлый комментарий', 'Previous note')}:</b> {data.reviewNote}</p>}
          <label className="block"><span className="mb-1 block font-bold text-navy">{L("Talabaga izoh (rad etish va ma'lumot so'rashda majburiy)", 'Комментарий студенту (обязателен при отказе и запросе)', 'Note to student (required for reject / request info)')}</span>
            <textarea className="input h-24 py-2" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        </div>
      )}
    </Modal>
  );
}

export default function AdminApplications() {
  const L = useL();
  const f = useDateFmt();
  const lab = useReviewLabel();
  const tb = useTable({ sort: 'updatedAt', f: { status: '' } });
  const { data, error, loading, reload } = useQuery<Page>(`/admin/panel/applications?${tb.qs}`);
  const [open, setOpen] = useState<string | null>(null);
  const cols: Col<Row>[] = [
    { key: 'u', label: L('Talaba', 'Студент', 'Student'), render: (r) => <div className="flex items-center gap-2.5"><Avatar name={`${r.user.firstName} ${r.user.lastName}`} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{r.user.firstName} {r.user.lastName}</p><p className="truncate text-xs text-muted">{r.user.email}</p></div></div> },
    { key: 'g', label: L('Grant', 'Грант', 'Grant'), render: (r) => <span className="block max-w-[240px] truncate">{r.title}</span> },
    { key: 'd', label: L('Topshirilgan', 'Подана', 'Submitted'), render: (r) => <span className="whitespace-nowrap text-xs">{r.submittedAt ? f.date(r.submittedAt) : '—'}</span> },
    { key: 's', label: L('Holat', 'Статус', 'Status'), render: (r) => <Badge tone={TONE[r.review]}>{lab(r.review)}</Badge> },
  ];
  const card = (r: Row) => (
    <button type="button" onClick={() => setOpen(r.id)} className="block w-full space-y-2 text-left">
      <div className="flex items-center gap-3"><Avatar name={`${r.user.firstName} ${r.user.lastName}`} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{r.user.firstName} {r.user.lastName}</p><p className="truncate text-xs text-muted">{r.title}</p></div><Badge tone={TONE[r.review]}>{lab(r.review)}</Badge></div>
    </button>
  );
  const c = data?.counts ?? {};
  return (
    <div>
      <PageTitle title={L('Arizalar', 'Заявки', 'Applications')} sub={L("Talabalar platformaga topshirgan arizalar: ko'rib chiqing, javob bering — talabaga bildirishnoma boradi", 'Заявки студентов: рассмотрите и ответьте — студент получит уведомление', 'Student applications: review and respond — the student is notified')} />
      <Tabs value={tb.s.f.status as any} onChange={(v) => tb.setFilter('status', v)} items={[{ v: '', label: L('Hammasi', 'Все', 'All') }, ...['SUBMITTED', 'IN_REVIEW', 'NEEDS_INFO', 'APPROVED', 'REJECTED'].map((s) => ({ v: s, label: lab(s), n: c[s] }))]} />
      <div className="mb-4 flex flex-wrap gap-2"><SearchBox value={tb.qInput} onChange={tb.setQInput} placeholder={L('Email, familiya yoki grant', 'Email, фамилия или грант', 'Email, surname or grant')} /></div>
      <DataTable cols={cols} rows={data?.items} loading={loading} error={!!error} onRetry={reload} card={card} onRow={(r) => setOpen(r.id)} empty={L("Arizalar yo'q", 'Заявок нет', 'No applications')} />
      {data && data.total > 0 && <Pagination page={data.page} pages={data.pages} total={data.total} limit={tb.s.limit} onPage={tb.setPage} onLimit={tb.setLimit} />}
      {open && <DetailModal id={open} onClose={() => setOpen(null)} onDone={reload} />}
    </div>
  );
}
