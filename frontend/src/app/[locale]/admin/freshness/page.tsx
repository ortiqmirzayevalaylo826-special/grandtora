'use client';
import { useEffect, useState } from 'react';
import { api, ApiError, useQuery } from '@/lib/client';
import { useErr } from '@/components/ui';
import { Badge, Col, DataTable, IconBtn, Modal, PageTitle, SearchBox, Select, Tabs, useDateFmt, useL, useToast } from '@/components/admin/kit';

interface Item { id: string; kind: 'grant' | 'program'; slug: string; title: string; organization: string; url: string; deadline: string | null; lastVerifiedAt: string | null; checkStatus: string; note: string | null; state: string }
interface Res { counts: Record<string, number>; total: number; items: Item[] }
const TONE: Record<string, string> = { UNCHECKED: 'gray', CHECKING: 'blue', VERIFIED: 'green', REJECTED: 'red', EXPIRED: 'amber' };
const STATES = ['UNCHECKED', 'CHECKING', 'VERIFIED', 'REJECTED', 'EXPIRED'];

export default function AdminFreshness() {
  const L = useL();
  const f = useDateFmt();
  const err = useErr();
  const toast = useToast();
  const [state, setState] = useState('');
  const [kind, setKind] = useState('');
  const [qInput, setQ] = useState('');
  const [q, setQd] = useState('');
  useEffect(() => { const t = setTimeout(() => setQd(qInput.trim()), 350); return () => clearTimeout(t); }, [qInput]);
  const p = new URLSearchParams();
  if (state) p.set('state', state); if (kind) p.set('kind', kind); if (q) p.set('q', q);
  const { data, error, loading, reload } = useQuery<Res>(`/admin/panel/fresh?${p.toString()}`);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [edit, setEdit] = useState<Item | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setSel(new Set()); }, [state, kind, q]);
  const stL = (s: string) => ({ UNCHECKED: L('Tekshirilmagan', 'Не проверено', 'Unchecked'), CHECKING: L('Tekshirilmoqda', 'Проверяется', 'Checking'), VERIFIED: L('Tasdiqlangan', 'Подтверждено', 'Verified'), REJECTED: L('Eskirgan', 'Устарело', 'Outdated'), EXPIRED: L("Muddati o'tgan", 'Срок истёк', 'Expired') }[s] ?? s);
  const key = (i: Item) => `${i.kind}:${i.id}`;
  const rows = (data?.items ?? []).map((i) => ({ ...i, id: key(i), rid: i.id }));
  type R = (typeof rows)[number];
  const fail = (x: unknown) => toast('err', err((x as ApiError).code));

  async function set(i: { kind: string; rid: string }, checkStatus: string, n?: string) {
    try { await api(`/admin/panel/fresh/${i.kind}/${i.rid}`, { method: 'PATCH', body: { checkStatus, note: n } }); toast('ok', L('Saqlandi', 'Сохранено', 'Saved')); reload(); } catch (x) { fail(x); }
  }
  async function bulk(checkStatus: string) {
    setBusy(true);
    try {
      const items = rows.filter((r) => sel.has(r.id)).map((r) => ({ kind: r.kind, id: r.rid }));
      const r = await api<{ done: number }>('/admin/panel/fresh/bulk', { body: { items, checkStatus } });
      toast('ok', L(`${r.done} ta yangilandi`, `Обновлено: ${r.done}`, `${r.done} updated`)); setSel(new Set()); reload();
    } catch (x) { fail(x); } finally { setBusy(false); }
  }
  async function saveNote() {
    if (!edit) return; setBusy(true);
    try { await api(`/admin/panel/fresh/${edit.kind}/${edit.id.includes(':') ? edit.id.split(':')[1] : edit.id}`, { method: 'PATCH', body: { checkStatus: edit.checkStatus, note } }); toast('ok', L('Saqlandi', 'Сохранено', 'Saved')); setEdit(null); reload(); } catch (x) { fail(x); } finally { setBusy(false); }
  }

  const cols: Col<R>[] = [
    { key: 't', label: L('Nomi', 'Название', 'Title'), render: (r) => <div className="max-w-[260px]"><p className="truncate font-semibold text-navy">{r.title}</p><p className="truncate text-xs text-muted">{r.organization} · {r.kind === 'grant' ? L('Grant', 'Грант', 'Grant') : L('Dastur', 'Программа', 'Program')}</p></div> },
    { key: 'u', label: L('Rasmiy havola', 'Официальная ссылка', 'Official link'), render: (r) => <a href={r.url} target="_blank" rel="noopener noreferrer" className="block max-w-[220px] truncate text-xs text-primary hover:underline">{r.url}</a> },
    { key: 'd', label: L('Muddat', 'Срок', 'Deadline'), render: (r) => <span className="whitespace-nowrap text-xs">{f.date(r.deadline)}</span> },
    { key: 'v', label: L('Oxirgi tekshiruv', 'Проверено', 'Last verified'), render: (r) => <span className="whitespace-nowrap text-xs text-muted">{r.lastVerifiedAt ? f.date(r.lastVerifiedAt) : '—'}</span> },
    { key: 's', label: L('Holat', 'Статус', 'Status'), render: (r) => <Badge tone={TONE[r.state]}>{stL(r.state)}</Badge> },
    { key: 'n', label: L('Izoh', 'Заметка', 'Note'), render: (r) => <span className="line-clamp-1 max-w-[140px] text-xs text-muted">{r.note ?? '—'}</span> },
    { key: 'a', label: L('Amallar', 'Действия', 'Actions'), render: (r) => (
      <div className="flex">
        <IconBtn icon="external" label={L('Havolani ochish', 'Открыть ссылку', 'Open link')} href={r.url} />
        <IconBtn icon="check" label={L('Tasdiqlandi', 'Подтвердить', 'Mark verified')} tone="hover:!text-primary" onClick={() => set(r, 'VERIFIED')} />
        <IconBtn icon="x" label={L('Eskirgan', 'Устарело', 'Mark outdated')} tone="hover:!text-red-600" onClick={() => set(r, 'REJECTED')} />
        <IconBtn icon="edit" label={L('Izoh / holat', 'Заметка / статус', 'Note / status')} onClick={() => { setEdit(r); setNote(r.note ?? ''); }} />
      </div>
    ) },
  ];
  const card = (r: R) => (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-bold text-navy">{r.title}</p><p className="text-xs text-muted">{r.organization}</p></div><Badge tone={TONE[r.state]}>{stL(r.state)}</Badge></div>
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-primary">{r.url}</a>
      <div className="flex gap-2"><button className="btn btn-primary !h-10 flex-1" onClick={() => set(r, 'VERIFIED')}>{L('Tasdiqlash', 'Подтвердить', 'Verify')}</button><button className="btn btn-ghost !h-10 flex-1" onClick={() => { setEdit(r); setNote(r.note ?? ''); }}>{L('Izoh', 'Заметка', 'Note')}</button></div>
    </div>
  );
  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : undefined;

  return (
    <div>
      <PageTitle title={L('Yangilik tekshiruvi', 'Проверка актуальности', 'Freshness check')} sub={L("Rasmiy havolani ochib, ma'lumot dolzarbligini qo'lda belgilang. Hech narsa avtomatik tasdiqlanmaydi.", 'Откройте официальную ссылку и отметьте актуальность вручную. Ничего не подтверждается автоматически.', 'Open the official link and mark accuracy by hand. Nothing is verified automatically.')} />
      <Tabs value={state} onChange={setState} items={[{ v: '', label: L('Hammasi', 'Все', 'All'), n: total }, ...STATES.map((s) => ({ v: s, label: stL(s), n: data?.counts[s] ?? 0 }))]} />
      <div className="mb-4 flex flex-wrap gap-2">
        <SearchBox value={qInput} onChange={setQ} placeholder={L('Nomi, tashkilot yoki havola', 'Название, организация или ссылка', 'Title, organization or link')} />
        <Select value={kind} onChange={setKind} label={L('Tur: barchasi', 'Тип: все', 'Type: all')} options={[['grant', L('Grantlar', 'Гранты', 'Grants')], ['program', L('Dasturlar', 'Программы', 'Programs')]]} />
      </div>
      {sel.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-navy px-4 py-3 text-sm text-white">
          <b>{sel.size}</b> {L('ta tanlandi', 'выбрано', 'selected')}
          {(['VERIFIED', 'CHECKING', 'REJECTED', 'UNCHECKED'] as const).map((s) => <button key={s} disabled={busy} className="rounded-lg bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25" onClick={() => bulk(s)}>{stL(s)}</button>)}
        </div>
      )}
      <DataTable cols={cols} rows={loading && !data ? undefined : rows} loading={loading} error={!!error} onRetry={reload} card={card} selected={sel} onSelect={setSel} empty={L("Bu holatda yozuv yo'q", 'Записей в этом статусе нет', 'No records in this state')} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.title ?? ''}
        footer={<><button className="btn btn-ghost" onClick={() => setEdit(null)}>{L('Bekor qilish', 'Отмена', 'Cancel')}</button><button className="btn btn-primary" disabled={busy} onClick={saveNote}>{L('Saqlash', 'Сохранить', 'Save')}</button></>}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{(['UNCHECKED', 'CHECKING', 'VERIFIED', 'REJECTED'] as const).map((s) => <button key={s} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${edit?.checkStatus === s ? 'border-primary bg-accent text-primary' : 'border-[#E5E7EB] text-muted'}`} onClick={() => edit && setEdit({ ...edit, checkStatus: s })}>{stL(s)}</button>)}</div>
          <label className="block text-sm font-semibold">{L('Izoh', 'Заметка', 'Note')}<textarea className="input mt-1 min-h-24 py-3" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} /></label>
        </div>
      </Modal>
    </div>
  );
}
