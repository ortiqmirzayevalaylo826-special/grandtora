'use client';
import { useState } from 'react';
import { useQuery } from '@/lib/client';
import { Badge, Col, DataTable, PageTitle, Pagination, Select, useDateFmt, useL } from '@/components/admin/kit';

interface Row { id: string; createdAt: string; actor: string | null; action: string; section: string; entity: string; entityId: string | null; ip: string | null; userAgent: string | null; result: string }
interface Page { items: Row[]; total: number; page: number; pages: number; limit: number }
const SECTIONS = ['grants', 'users', 'chat', 'reviews', 'tickets', 'fresh', 'catalog', 'auth', 'other'];

export default function AdminAudit() {
  const L = useL();
  const f = useDateFmt();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [flt, setFlt] = useState({ from: '', to: '', actor: '', action: '', section: '', result: '' });
  const set = (k: string, v: string) => { setFlt((x) => ({ ...x, [k]: v })); setPage(1); };
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(flt)) if (v) p.set(k, v);
  const filters = p.toString();
  p.set('page', String(page)); p.set('limit', String(limit));
  const { data, error, loading, reload } = useQuery<Page>(`/admin/panel/audit?${p.toString()}`);
  const admins = useQuery<{ id: string; firstName: string; lastName: string; email: string }[]>('/admin/panel/admins');
  const cols: Col<Row>[] = [
    { key: 't', label: L('Vaqt', 'Время', 'Time'), render: (r) => <span className="whitespace-nowrap text-xs">{f.dt(r.createdAt)}</span> },
    { key: 'a', label: 'Admin', render: (r) => <span className="block max-w-[190px] truncate">{r.actor ?? '—'}</span> },
    { key: 'ac', label: L('Amal', 'Действие', 'Action'), render: (r) => <span className="font-mono text-xs font-semibold text-navy">{r.action}</span> },
    { key: 's', label: L("Bo'lim", 'Раздел', 'Section'), render: (r) => <span className="text-xs">{r.section}</span> },
    { key: 'o', label: L("Ob'ekt", 'Объект', 'Object'), render: (r) => <span className="block max-w-[150px] truncate text-xs text-muted">{r.entity}{r.entityId ? ` · ${r.entityId.slice(0, 8)}` : ''}</span> },
    { key: 'ip', label: 'IP', render: (r) => <span className="font-mono text-xs">{r.ip ?? '—'}</span> },
    { key: 'ua', label: L('Brauzer', 'Браузер', 'Browser'), render: (r) => <span className="block max-w-[140px] truncate text-xs text-muted" title={r.userAgent ?? ''}>{r.userAgent ?? '—'}</span> },
    { key: 'r', label: L('Natija', 'Результат', 'Result'), render: (r) => <Badge tone={r.result === 'OK' ? 'green' : 'red'}>{r.result === 'OK' ? L('Muvaffaqiyatli', 'Успешно', 'Success') : L('Xato', 'Ошибка', 'Failed')}</Badge> },
  ];
  const card = (r: Row) => (
    <div className="space-y-1.5"><div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-bold text-navy">{r.action}</span><Badge tone={r.result === 'OK' ? 'green' : 'red'}>{r.result}</Badge></div>
      <p className="truncate text-xs text-muted">{r.actor ?? '—'} · {r.section}</p><p className="text-xs text-muted">{f.dt(r.createdAt)} · {r.ip ?? ''}</p></div>
  );
  const dirty = Object.values(flt).some(Boolean);
  return (
    <div>
      <PageTitle title={L('Audit jurnali', 'Журнал аудита', 'Audit log')} sub={L('Adminlarning barcha muhim amallari', 'Все важные действия администраторов', 'All significant admin actions')}>
        <a className="btn btn-ghost" href={`/api/admin/panel/audit/export.csv?${filters}`}>{L('CSV yuklab olish', 'Скачать CSV', 'Download CSV')}</a>
      </PageTitle>
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="text-xs font-semibold text-muted">{L('Dan', 'С', 'From')}<input type="date" className="input mt-1" value={flt.from} onChange={(e) => set('from', e.target.value)} /></label>
        <label className="text-xs font-semibold text-muted">{L('Gacha', 'По', 'To')}<input type="date" className="input mt-1" value={flt.to} onChange={(e) => set('to', e.target.value)} /></label>
        <Select value={flt.actor} onChange={(v) => set('actor', v)} label={L('Admin: barchasi', 'Админ: все', 'Admin: all')} options={(admins.data ?? []).map((a) => [a.id, a.email])} />
        <Select value={flt.section} onChange={(v) => set('section', v)} label={L("Bo'lim: barchasi", 'Раздел: все', 'Section: all')} options={SECTIONS.map((s) => [s, s])} />
        <Select value={flt.result} onChange={(v) => set('result', v)} label={L('Natija: barchasi', 'Результат: все', 'Result: all')} options={[['OK', L('Muvaffaqiyatli', 'Успешно', 'Success')], ['FAIL', L('Xato', 'Ошибка', 'Failed')]]} />
        <input className="input w-44" placeholder={L('Amal (masalan DELETE)', 'Действие (DELETE)', 'Action (e.g. DELETE)')} value={flt.action} onChange={(e) => set('action', e.target.value)} />
        {dirty && <button className="btn btn-ghost" onClick={() => { setFlt({ from: '', to: '', actor: '', action: '', section: '', result: '' }); setPage(1); }}>{L('Tozalash', 'Сбросить', 'Reset')}</button>}
      </div>
      <DataTable cols={cols} rows={data?.items} loading={loading} error={!!error} onRetry={reload} card={card} empty={L("Yozuv topilmadi", 'Записей не найдено', 'No entries found')} />
      {data && data.total > 0 && <Pagination page={data.page} pages={data.pages} total={data.total} limit={limit} onPage={setPage} onLimit={(n) => { setLimit(n); setPage(1); }} />}
    </div>
  );
}
